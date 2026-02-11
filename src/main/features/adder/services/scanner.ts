import * as fse from 'fs-extra'
import * as path from 'path'
import { EventEmitter } from 'events'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { getGameEntityFoldersByHierarchyLevel, getGameFolders } from '~/utils'
import { addGameToDB } from './adder'
import { scraperManager } from '~/features/scraper'
import { OverallScanProgress } from '@appTypes/utils'
import log from 'electron-log/main'
import { ipcManager } from '~/core/ipc'
import { eventBus } from '~/core/events'

// Scanner configuration type
interface ScannerConfig {
  path: string
  dataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite' | string
  targetCollection: string
  scanMode?: 'auto' | 'hierarchy'
  hierarchyLevel?: number
  // Backward compatibility for old configs
  depth?: number
  deepth?: number
  normalizeFolderName?: boolean
}

// Global scanner configuration
interface GlobalScannerConfig {
  interval: number
  ignoreList: string[]
  list: {
    [key: string]: ScannerConfig
  }
}

export class GameScanner extends EventEmitter {
  private scanProgress: OverallScanProgress = {
    status: 'idle',
    currentScannerId: '',
    processedScanners: 0,
    totalScanners: 0,
    scannersToProcess: [],
    scannedGames: 0,
    scannerProgresses: {}
  }
  private currentScannerConfig: (ScannerConfig & { id: string }) | null = null
  private globalScanTimer: NodeJS.Timeout | null = null
  private lastScanTime: number = 0
  private autoStartPeriodicScan: boolean = true

  constructor() {
    super()
    this.setupIPC()
  }

  private setupIPC(): void {
    // Start scanning all game directories
    ipcManager.handle('scanner:scan-all', async () => {
      await this.startScan()
      return this.scanProgress
    })

    // Start scanning a specific game directory
    ipcManager.handle('scanner:scan-scanner', async (_, scannerId: string) => {
      await this.scanSpecificScanner(scannerId)
      return this.scanProgress
    })

    // Stop scanning
    ipcManager.handle('scanner:stop-scan', () => {
      this.stopScan()
      return this.scanProgress
    })

    // Get current scan progress
    ipcManager.handle('scanner:get-progress', () => {
      return this.scanProgress
    })

    // Fix failed folder
    ipcManager.handle(
      'scanner:fix-folder',
      async (_, folderPath: string, gameId: string, dataSource: string) => {
        await this.fixFailedFolder(folderPath, gameId, dataSource)
        return this.scanProgress
      }
    )

    // Start periodic scan
    ipcManager.handle('scanner:start-periodic-scan', async () => {
      await this.startPeriodicScan()
      return this.getPeriodicScanStatus()
    })

    // Stop periodic scan
    ipcManager.handle('scanner:stop-periodic-scan', () => {
      this.stopPeriodicScan()
      return this.getPeriodicScanStatus()
    })

    // Get periodic scan status
    ipcManager.handle('scanner:get-periodic-scan-status', () => {
      return this.getPeriodicScanStatus()
    })

    // Add method to get progress on demand
    ipcManager.handle('scanner:request-progress', () => {
      return { ...this.scanProgress }
    })

    // Add method to ignore failed folder
    ipcManager.handle(
      'scanner:ignore-failed-folder',
      (_, scannerId: string, folderPath: string) => {
        this.ignoreFailedFolder(scannerId, folderPath)
        return this.scanProgress
      }
    )
  }

  private async getGlobalScannerConfig(): Promise<GlobalScannerConfig> {
    const scannerConfig = await ConfigDBManager.getConfigLocalValue('game.scanner')
    if (!scannerConfig) {
      throw new Error('Scanner configuration does not exist')
    }
    return scannerConfig as GlobalScannerConfig
  }

  public async startScan(): Promise<void> {
    if (this.scanProgress.status === 'scanning') {
      console.log('Scan already in progress')
      return // Already scanning
    }
    try {
      // Get global scanner configuration
      const scannerConfig = await this.getGlobalScannerConfig()
      if (!scannerConfig.list || Object.keys(scannerConfig.list).length === 0) {
        console.log('No scan directories configured, cannot start scanning')
        return
      }

      const scannerIds = Object.keys(scannerConfig.list)

      // Initialize total progress
      this.scanProgress = {
        status: 'scanning',
        currentScannerId: '',
        processedScanners: 0,
        totalScanners: scannerIds.length,
        scannersToProcess: scannerIds,
        scannedGames: 0,
        scannerProgresses: {}
      }

      // Initialize progress for each scanner
      for (const scannerId of scannerIds) {
        this.scanProgress.scannerProgresses[scannerId] = {
          status: 'idle',
          processedFolders: 0,
          totalFolders: 0,
          currentFolder: '',
          foldersToProcess: [],
          failedFolders: [],
          scannedGames: 0
        }
      }

      // Notify renderer process that scan has started
      ipcManager.send('scanner:scan-start', { ...this.scanProgress })
      eventBus.emit(
        'scanner:started',
        {
          scannerId: 'all',
          scannerPath: '',
          totalScanners: scannerIds.length
        },
        { source: 'game-scanner' }
      )

      // Process each scan directory
      for (let i = 0; i < scannerIds.length && this.scanProgress.status === 'scanning'; i++) {
        const scannerId = scannerIds[i]
        const config = scannerConfig.list[scannerId]
        this.currentScannerConfig = {
          ...config,
          id: scannerId
        }
        this.scanProgress.currentScannerId = scannerId
        await this.scanDirectory(this.currentScannerConfig, scannerConfig.ignoreList)
        this.scanProgress.processedScanners++

        // Check scan status after each scanner completes
        if (this.scanProgress.status !== 'scanning') {
          break
        }
      }

      // Only set to completed if all scanners processed successfully and status is still scanning
      if (this.scanProgress.status === 'scanning') {
        this.scanProgress.status = 'completed'
        ipcManager.send('scanner:scan-completed', { ...this.scanProgress })

        eventBus.emit(
          'scanner:completed',
          {
            scannerId: 'all',
            gamesAdded: this.scanProgress.scannedGames,
            duration: Date.now() - this.lastScanTime,
            failedFolders: Object.values(this.scanProgress.scannerProgresses).reduce(
              (sum, progress) => sum + progress.failedFolders.length,
              0
            ),
            totalProcessed: this.scanProgress.processedScanners
          },
          { source: 'game-scanner' }
        )

        // Update last scan time
        this.lastScanTime = Date.now()
      }
    } catch (error) {
      this.scanProgress.status = 'error'
      this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
      ipcManager.send('scanner:scan-error', { ...this.scanProgress })
    } finally {
      // Reset current scanner config when done
      if (this.scanProgress.status !== 'scanning') {
        this.currentScannerConfig = null
      }
    }
  }

  public async scanSpecificScanner(scannerId: string): Promise<void> {
    if (this.scanProgress.status === 'scanning') {
      console.log('Scan already in progress')
      return // Already scanning
    }
    try {
      // Get global scanner configuration
      const scannerConfig = await this.getGlobalScannerConfig()
      if (!scannerConfig.list) {
        throw new Error('Scanner configuration does not exist')
      }
      const scanner = scannerConfig.list[scannerId]
      if (!scanner) {
        throw new Error('Specified scanner not found')
      }

      // Initialize total progress and scanner progress
      this.scanProgress = {
        status: 'scanning',
        currentScannerId: scannerId,
        processedScanners: 0,
        totalScanners: 1,
        scannersToProcess: [scannerId],
        scannedGames: 0,
        scannerProgresses: {}
      }
      this.scanProgress.scannerProgresses[scannerId] = {
        status: 'idle',
        processedFolders: 0,
        totalFolders: 0,
        currentFolder: '',
        foldersToProcess: [],
        failedFolders: [],
        scannedGames: 0
      }
      this.currentScannerConfig = {
        ...scanner,
        id: scannerId
      }

      // Notify render process that scan has started
      ipcManager.send('scanner:scan-start', { ...this.scanProgress })

      // Execute scan
      await this.scanDirectory(this.currentScannerConfig, scannerConfig.ignoreList)
      this.scanProgress.processedScanners = 1

      // Only set to completed if status is still scanning
      if (this.scanProgress.status === 'scanning') {
        this.scanProgress.status = 'completed'
        ipcManager.send('scanner:scan-completed', { ...this.scanProgress })
      }
    } catch (error) {
      this.scanProgress.status = 'error'
      this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
      ipcManager.send('scanner:scan-error', { ...this.scanProgress })
    } finally {
      // Reset current scanner config when done
      if (this.scanProgress.status !== 'scanning') {
        this.currentScannerConfig = null
      }
    }
  }

  /**
   * Scan a single directory
   */
  private async scanDirectory(
    scanner: ScannerConfig & { id: string },
    ignoreList: string[]
  ): Promise<void> {
    const scannerId = scanner.id
    const scannerPath = scanner.path
    this.scanProgress.currentScannerId = scannerId
    log.info(`[Scanner] Start scanning directory: ${scannerPath}`)

    // Get scanner progress object
    const scannerProgress = this.scanProgress.scannerProgresses[scannerId]
    scannerProgress.status = 'scanning'
    ipcManager.send('scanner:scan-progress', { ...this.scanProgress })
    eventBus.emit(
      'scanner:started',
      {
        scannerId,
        scannerPath,
        totalScanners: 1
      },
      { source: 'game-scanner' }
    )

    try {
      // Check if path exists
      if (!(await fse.pathExists(scannerPath))) {
        throw new Error(`Scan directory does not exist: ${scannerPath}`)
      }

      // Get all folders
      let foldersToScan: { name: string; dirPath: string }[] = []

      // Get folders based on scan mode
      const scanMode = scanner.scanMode === 'hierarchy' ? 'hierarchy' : 'auto'
      if (scanMode === 'hierarchy') {
        const legacyDepth =
          typeof scanner.depth === 'number'
            ? scanner.depth
            : typeof scanner.deepth === 'number'
              ? scanner.deepth
              : undefined
        const level =
          typeof scanner.hierarchyLevel === 'number'
            ? scanner.hierarchyLevel
            : typeof legacyDepth === 'number'
              ? legacyDepth - 1
              : 0

        foldersToScan = await getGameEntityFoldersByHierarchyLevel(scannerPath, level)
      } else {
        foldersToScan = await getGameFolders(scannerPath)
      }

      // Apply ignore list
      foldersToScan = this.applyIgnoreList(foldersToScan, ignoreList)

      // Update progress info
      scannerProgress.foldersToProcess = foldersToScan.map((f) => f.dirPath)
      scannerProgress.totalFolders = foldersToScan.length
      scannerProgress.processedFolders = 0 // Initialize to 0
      ipcManager.send('scanner:scan-progress', { ...this.scanProgress })

      // Process each folder directly (no more queue)
      for (let i = 0; i < foldersToScan.length; i++) {
        // Check status at the beginning of each loop
        if (this.scanProgress.status !== 'scanning') {
          // If not scanning, return directly without further processing
          log.info(`[Scanner] Scanning stopped`)
          // Notify that scan was stopped
          ipcManager.send('scanner:scan-stopped', { ...this.scanProgress })
          return
        }

        const folder = foldersToScan[i]
        scannerProgress.currentFolder = folder.dirPath
        ipcManager.send('scanner:scan-progress', { ...this.scanProgress })

        // Process the folder
        await this.processFolder(
          scanner.dataSource,
          folder,
          scannerId,
          Boolean(scanner.normalizeFolderName)
        )

        // Update progress after each folder is processed
        scannerProgress.processedFolders++
        scannerProgress.currentFolder = ''
        ipcManager.send('scanner:scan-progress', { ...this.scanProgress })
      }

      // Only set to completed if all folders processed successfully
      if (this.scanProgress.status === 'scanning') {
        scannerProgress.status = 'completed'
        ipcManager.send('scanner:scan-progress', { ...this.scanProgress })
      }
    } catch (error) {
      log.error(`[Scanner] Error scanning directory ${scannerPath}:`, error)
      scannerProgress.status = 'error'
      scannerProgress.errorMessage = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  /**
   * Process a single folder
   */
  private async processFolder(
    dataSource: string,
    folder: { name: string; dirPath: string },
    scannerId: string,
    normalizeFolderName: boolean
  ): Promise<void> {
    if (this.scanProgress.status !== 'scanning') {
      return // Exit if scanning has been stopped
    }

    const scannerProgress = this.scanProgress.scannerProgresses[scannerId]

    try {
      // Check if the game already exists
      const gameExists = await GameDBManager.checkGameExitsByPath(folder.dirPath)

      if (!gameExists) {
        let searchName = folder.name
        if (normalizeFolderName) {
          searchName = this.normalizeFolderName(folder.name)
        }

        // Use folder name as game name for search
        const gameResults = await scraperManager.searchGames(dataSource, searchName, folder.dirPath)

        if (gameResults && gameResults.length > 0) {
          // Use the first result as a match
          const match = gameResults[0]

          // Get the target collection from scanner config
          const scannerList = await ConfigDBManager.getConfigLocalValue('game.scanner.list')
          let targetCollection = scannerList[scannerId]?.targetCollection || undefined
          if (targetCollection === 'none') {
            targetCollection = undefined // Convert 'none' to undefined
          }
          if (targetCollection) {
            // Validate target collection
            const isTargetCollectionValid =
              await GameDBManager.checkCollectionExists(targetCollection)
            if (!isTargetCollectionValid) {
              targetCollection = undefined
              ConfigDBManager.setConfigLocalValue('game.scanner.list', {
                ...scannerList,
                [scannerId]: {
                  ...scannerList[scannerId],
                  targetCollection: ''
                }
              })
            }
          }

          await addGameToDB({
            dataSource,
            dataSourceId: match.id,
            dirPath: folder.dirPath,
            targetCollection
          })
        } else {
          // If no match is found
          throw new Error(`No games found matching "${folder.name}"`)
        }
      }

      // Update the scanner's game count
      scannerProgress.scannedGames++
      this.scanProgress.scannedGames++
    } catch (error) {
      // Record failed folder
      scannerProgress.failedFolders.push({
        path: folder.dirPath,
        name: folder.name,
        error: error instanceof Error ? error.message : String(error),
        dataSource
      })
      ipcManager.send('scanner:scan-folder-error', { ...this.scanProgress })
    }
  }

  private normalizeFolderName(name: string): string {
    if (!name) return ''
    const normalized = name
      // 1. Remove content within brackets
      .replace(/[[(（【].*?[\])）】]/g, ' ')
      // 2. Replace special characters with spaces
      .replace(/[_\-!！~～.·•★☆※#@^$%&+=|\\/:;"'<>,?]/g, ' ')
      // 3. Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // 4. Trim
      .trim()

    return normalized.length > 0 ? normalized : name
  }

  private applyIgnoreList(
    folders: { name: string; dirPath: string }[],
    ignoreList: string[]
  ): { name: string; dirPath: string }[] {
    if (!ignoreList || ignoreList.length === 0) {
      return folders
    }

    // Normalize and de-duplicate ignore patterns
    const normalizedIgnore = Array.from(
      new Set(
        ignoreList
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
          // Normalize path separators to forward slashes for consistent matching
          .map((p) => p.replace(/\\/g, '/'))
      )
    ).sort()

    // Build regex list (best-effort: invalid patterns are skipped)
    const regexList: RegExp[] = []
    for (const pattern of normalizedIgnore) {
      try {
        regexList.push(new RegExp(pattern, 'i'))
      } catch (_e) {
        // Skip invalid regex, it will still be handled by literal rules below if applicable
      }
    }

    // Split into path-based and name-based literal rules
    const pathIgnores = normalizedIgnore
      .filter((p) => p.includes('/'))
      .map((p) => p.replace(/\/+$/, '').toLowerCase())
    const nameIgnores = normalizedIgnore.filter((p) => !p.includes('/')).map((p) => p.toLowerCase())

    // Filter out folders matching ignore patterns
    return folders.filter((folder) => {
      const folderNameLower = folder.name.toLowerCase()
      const normalizedDirPath = path
        .normalize(folder.dirPath)
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
      const normalizedDirPathLower = normalizedDirPath.toLowerCase()

      // 0) Regex-based ignore: match against name or full path
      for (const rx of regexList) {
        if (rx.test(folder.name) || rx.test(normalizedDirPath)) return false
      }

      // 1) Name-based ignore: exact match on folder name (case-insensitive)
      if (nameIgnores.includes(folderNameLower)) return false

      // 2) Path-based ignore: ignore the directory itself and all its descendants
      for (const ig of pathIgnores) {
        if (normalizedDirPathLower === ig || normalizedDirPathLower.startsWith(ig + '/')) {
          return false
        }
      }

      return true
    })
  }

  public stopScan(): void {
    if (this.scanProgress.status === 'scanning') {
      log.info('[Scanner] Stopping scan')

      // Set status to idle immediately so all processing loops will exit
      this.scanProgress.status = 'idle'

      // Reset all scan progress
      this.scanProgress = {
        status: 'idle',
        currentScannerId: '',
        processedScanners: 0,
        totalScanners: 0,
        scannersToProcess: [],
        scannedGames: 0,
        scannerProgresses: {}
      }

      // Reset current scanner config
      this.currentScannerConfig = null
    }
  }

  public async fixFailedFolder(
    folderPath: string,
    gameId: string,
    dataSource: string
  ): Promise<void> {
    try {
      // Find failed folder in all scanners
      let foundScannerId: string | null = null
      let foundIndex: number = -1
      for (const scannerId in this.scanProgress.scannerProgresses) {
        const scannerProgress = this.scanProgress.scannerProgresses[scannerId]
        const index = scannerProgress.failedFolders.findIndex((f) => f.path === folderPath)
        if (index !== -1) {
          foundScannerId = scannerId
          foundIndex = index
          break
        }
      }
      if (foundScannerId === null || foundIndex === -1) {
        throw new Error('Failed folder not found')
      }

      // Get the scanner target collection
      const scannerList = await ConfigDBManager.getConfigLocalValue('game.scanner.list')
      let targetCollection = scannerList[foundScannerId]?.targetCollection || undefined
      if (targetCollection === 'none') {
        targetCollection = undefined // Convert 'none' to undefined
      }
      if (targetCollection) {
        // Validate target collection
        const isTargetCollectionValid = await GameDBManager.checkCollectionExists(targetCollection)
        if (!isTargetCollectionValid) {
          targetCollection = undefined
          ConfigDBManager.setConfigLocalValue('game.scanner.list', {
            ...scannerList,
            [foundScannerId]: {
              ...scannerList[foundScannerId],
              targetCollection: ''
            }
          })
        }
      }

      // Add game with provided game ID
      await addGameToDB({
        dataSource,
        dataSourceId: gameId,
        dirPath: folderPath,
        targetCollection
      })

      // Remove from failed list
      const scannerProgress = this.scanProgress.scannerProgresses[foundScannerId]
      scannerProgress.failedFolders.splice(foundIndex, 1)
      scannerProgress.scannedGames++
      this.scanProgress.scannedGames++
      ipcManager.send('scanner:scan-folder-fixed', { ...this.scanProgress })
      eventBus.emit(
        'scanner:folder-fixed',
        {
          scannerId: foundScannerId,
          folderPath,
          gameId
        },
        { source: 'game-scanner' }
      )
    } catch (error) {
      log.error('[Scanner] Fix folder failed:', error)
      throw error
    }
  }

  private ignoreFailedFolder(scannerId: string, folderPath: string): void {
    try {
      // Find the scanner progress
      const scannerProgress = this.scanProgress.scannerProgresses[scannerId]
      if (!scannerProgress) {
        throw new Error('Scanner not found')
      }

      // Find the failed folder
      const index = scannerProgress.failedFolders.findIndex((f) => f.path === folderPath)
      if (index === -1) {
        throw new Error('Failed folder not found')
      }

      // Remove from failed list
      scannerProgress.failedFolders.splice(index, 1)
      ipcManager.send('scanner:scan-progress', { ...this.scanProgress })
      eventBus.emit(
        'scanner:folder-ignored',
        {
          scannerId,
          folderPath
        },
        { source: 'game-scanner' }
      )
    } catch (error) {
      log.error('[Scanner] Ignore failed folder failed:', error)
      throw error
    }
  }

  public getScanProgress(): OverallScanProgress {
    return { ...this.scanProgress }
  }

  public async startPeriodicScan(): Promise<void> {
    // Stop existing timer scan
    this.stopPeriodicScan()
    try {
      // Get global scanner configuration
      const scannerConfig = await this.getGlobalScannerConfig()
      if (!scannerConfig.list || Object.keys(scannerConfig.list).length === 0) {
        console.log('No scan directories configured, cannot start periodic scan')
        return
      }

      // Get global scan interval
      const interval = scannerConfig.interval

      // Check if valid scan interval is set (interval <= 0 means auto scan is disabled)
      if (!interval || interval <= 0) {
        log.info('[Scanner] Periodic scan is disabled (interval is <= 0)')
        return
      }

      // Ensure interval is at least 5 minutes to prevent frequent scanning
      const safeInterval = Math.min(Math.max(interval, 60000 * 5), 2147483647)
      log.info(`[Scanner] Setting global periodic scan at ${safeInterval}ms`)

      // Record last scan time
      this.lastScanTime = Date.now()

      // Set global timer
      this.globalScanTimer = setInterval(async () => {
        // Skip this scan if already scanning
        if (this.scanProgress.status === 'scanning') {
          console.log(`Periodic scan triggered, but scan in progress, skipping this scan`)
          return
        }
        log.info(`[Scanner] Periodic global scan triggered`)
        try {
          await this.startScan()
        } catch (error) {
          log.error(`[Scanner] Global periodic scan failed:`, error)
        }
      }, safeInterval)
      log.info(`[Scanner] Global periodic scan started`)
    } catch (error) {
      log.error('[Scanner] Start periodic scan failed:', error)
      throw error
    }
  }

  public stopPeriodicScan(): boolean {
    if (this.globalScanTimer) {
      clearInterval(this.globalScanTimer)
      this.globalScanTimer = null
      log.info(`[Scanner] Global periodic scan stopped`)
      return true
    }
    return false
  }

  public async getPeriodicScanStatus(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }> {
    // Get current configured scan interval
    let interval: number | null = null
    try {
      const scannerConfig = await this.getGlobalScannerConfig()
      interval = scannerConfig.interval || null
    } catch (error) {
      console.error('Failed to get scan interval:', error)
    }
    return {
      active: this.globalScanTimer !== null,
      lastScanTime: this.lastScanTime,
      autoStart: this.autoStartPeriodicScan,
      interval
    }
  }
}

export const GameScannerManager = new GameScanner()
