import { BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as fse from 'fs-extra'
import { EventEmitter } from 'events'
import { ConfigDBManager, GameDBManager } from '~/database'
import { getSubfoldersByDepth } from '~/utils'
import { addGameToDatabase } from './services'
import { searchGames } from '~/scraper'
import { OverallScanProgress } from '@appTypes/utils'

// Scanner configuration type
interface ScannerConfig {
  path: string
  dataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite'
  depth: number
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

  // Message queue and throttling related properties
  private messageQueue: { event: string; data: any }[] = []
  private isProcessingQueue: boolean = false
  private lastNotifyTime: number = 0
  private notifyThrottleTime: number = 200

  constructor() {
    super()
    this.setupIPC()
  }

  /**
   * Setup IPC communication
   */
  private setupIPC(): void {
    // Start scanning all game directories
    ipcMain.handle('game-scanner:scan-all', async () => {
      await this.startScan()
      return this.scanProgress
    })

    // Start scanning a specific game directory
    ipcMain.handle('game-scanner:scan-scanner', async (_, scannerId: string) => {
      await this.scanSpecificScanner(scannerId)
      return this.scanProgress
    })

    // Pause scanning
    ipcMain.handle('game-scanner:pause-scan', () => {
      this.pauseScan()
      return this.scanProgress
    })

    // Resume scanning
    ipcMain.handle('game-scanner:resume-scan', async () => {
      await this.resumeScan()
      return this.scanProgress
    })

    // Stop scanning
    ipcMain.handle('game-scanner:stop-scan', () => {
      this.stopScan()
      return this.scanProgress
    })

    // Get current scan progress
    ipcMain.handle('game-scanner:get-progress', () => {
      return this.scanProgress
    })

    // Fix failed folder
    ipcMain.handle(
      'game-scanner:fix-folder',
      async (_, folderPath: string, gameId: string, dataSource: string) => {
        await this.fixFailedFolder(folderPath, gameId, dataSource)
        return this.scanProgress
      }
    )

    // Start periodic scan
    ipcMain.handle('game-scanner:start-periodic-scan', async () => {
      await this.startPeriodicScan()
      return this.getPeriodicScanStatus()
    })

    // Stop periodic scan
    ipcMain.handle('game-scanner:stop-periodic-scan', () => {
      this.stopPeriodicScan()
      return this.getPeriodicScanStatus()
    })

    // Get periodic scan status
    ipcMain.handle('game-scanner:get-periodic-scan-status', () => {
      return this.getPeriodicScanStatus()
    })

    // Add method to get progress on demand
    ipcMain.handle('game-scanner:request-progress', () => {
      return { ...this.scanProgress }
    })
  }

  /**
   * Get global scanner configuration
   */
  private async getGlobalScannerConfig(): Promise<GlobalScannerConfig> {
    const scannerConfig = await ConfigDBManager.getConfigLocalValue('game.scanner')
    if (!scannerConfig) {
      throw new Error('Scanner configuration does not exist')
    }
    return scannerConfig
  }

  /**
   * Start scanning all game directories
   */
  public async startScan(): Promise<void> {
    if (this.scanProgress.status === 'scanning') {
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

      // Notify render process that scan has started
      this.notifyProgressUpdate('scan-start')

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
        this.notifyProgressUpdate('scan-completed')

        // Update last scan time
        this.lastScanTime = Date.now()
      }
    } catch (error) {
      this.scanProgress.status = 'error'
      this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
      this.notifyProgressUpdate('scan-error')
    } finally {
      // Reset current scanner config if not paused
      if (this.scanProgress.status !== 'paused') {
        this.currentScannerConfig = null
      }
    }
  }

  /**
   * Scan specific directory
   */
  public async scanSpecificScanner(scannerId: string): Promise<void> {
    if (this.scanProgress.status === 'scanning') {
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
      this.notifyProgressUpdate('scan-start')

      // Execute scan
      await this.scanDirectory(this.currentScannerConfig, scannerConfig.ignoreList)
      this.scanProgress.processedScanners = 1

      // Only set to completed if status is still scanning
      if (this.scanProgress.status === 'scanning') {
        this.scanProgress.status = 'completed'
        this.notifyProgressUpdate('scan-completed')
      }
    } catch (error) {
      this.scanProgress.status = 'error'
      this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
      this.notifyProgressUpdate('scan-error')
    } finally {
      // Reset current scanner config if not paused
      if (this.scanProgress.status !== 'paused') {
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
    console.log(`Start scanning directory: ${scannerPath}`)

    // Get scanner progress object
    const scannerProgress = this.scanProgress.scannerProgresses[scannerId]
    scannerProgress.status = 'scanning'
    this.notifyProgressUpdate('scan-progress')

    try {
      // Check if path exists
      if (!(await fse.pathExists(scannerPath))) {
        throw new Error(`Scan directory does not exist: ${scannerPath}`)
      }

      // Get all folders
      let foldersToScan: { name: string; dirPath: string }[] = []

      // Get subfolders at specified depth
      foldersToScan = await getSubfoldersByDepth(scannerPath, scanner.depth)

      // Apply ignore list
      foldersToScan = this.applyIgnoreList(foldersToScan, ignoreList)

      // Update progress info
      scannerProgress.foldersToProcess = foldersToScan.map((f) => f.dirPath)
      scannerProgress.totalFolders = foldersToScan.length
      scannerProgress.processedFolders = 0
      this.notifyProgressUpdate('scan-progress')

      // Process each folder
      for (let i = 0; i < foldersToScan.length; i++) {
        // Check status at the beginning of each loop
        if (this.scanProgress.status !== 'scanning') {
          // If not scanning, return directly without further processing
          console.log(`Scanning ${this.scanProgress.status === 'paused' ? 'paused' : 'stopped'}`)
          return
        }

        const folder = foldersToScan[i]
        scannerProgress.currentFolder = folder.dirPath
        this.notifyProgressUpdate('scan-progress')

        try {
          // Check if game already exists
          const gameExists = await GameDBManager.checkGameExitsByPath(folder.dirPath)

          if (!gameExists) {
            // Check status again before long operation
            if (this.scanProgress.status !== 'scanning') {
              return
            }

            // Use folder name as game name to search for ID
            await this.addGameByFolderName(scanner.dataSource, folder)

            // Check status again after wait
            if (this.scanProgress.status !== 'scanning') {
              return
            }

            await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds
          }

          scannerProgress.scannedGames++
          this.scanProgress.scannedGames++
          this.notifyProgressUpdate('scan-progress')
        } catch (error) {
          // Record failed folder
          scannerProgress.failedFolders.push({
            path: folder.dirPath,
            name: folder.name,
            error: error instanceof Error ? error.message : String(error),
            dataSource: scanner.dataSource // Save data source
          })
          this.notifyProgressUpdate('scan-folder-error')
        }

        // Update progress
        scannerProgress.processedFolders++
        this.notifyProgressUpdate('scan-progress')
      }

      // Only set to completed if all folders are processed normally
      if (this.scanProgress.status === 'scanning') {
        scannerProgress.status = 'completed'
        this.notifyProgressUpdate('scan-progress')
      }
    } catch (error) {
      console.error(`Error scanning directory ${scannerPath}:`, error)
      scannerProgress.status = 'error'
      scannerProgress.errorMessage = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  /**
   * Add game by folder name
   */
  private async addGameByFolderName(
    dataSource: string,
    folder: { name: string; dirPath: string }
  ): Promise<void> {
    // Use folder name as game name for search
    const gameResults = await searchGames(dataSource, folder.name)
    if (gameResults && gameResults.length > 0) {
      // Use first result as match
      const match = gameResults[0]
      await addGameToDatabase({
        dataSource,
        dataSourceId: match.id,
        dirPath: folder.dirPath
      })
    } else {
      // If no match found, add game without metadata
      throw new Error(`No games found matching "${folder.name}"`)
    }
  }

  /**
   * Apply ignore list to filter folders
   */
  private applyIgnoreList(
    folders: { name: string; dirPath: string }[],
    ignoreList: string[]
  ): { name: string; dirPath: string }[] {
    if (!ignoreList || ignoreList.length === 0) {
      return folders
    }
    // Convert ignore list to regex patterns
    const regexList = ignoreList.map((pattern) => new RegExp(pattern))
    // Filter out folders matching ignore patterns
    return folders.filter((folder) => {
      return !regexList.some((regex) => regex.test(folder.name))
    })
  }

  /**
   * Pause scanning
   */
  public pauseScan(): void {
    if (this.scanProgress.status === 'scanning') {
      console.log('Pausing scan')
      this.scanProgress.status = 'paused'

      // Pause current scanner progress
      const currentScannerId = this.scanProgress.currentScannerId
      if (currentScannerId && this.scanProgress.scannerProgresses[currentScannerId]) {
        this.scanProgress.scannerProgresses[currentScannerId].status = 'paused'
      }

      this.notifyProgressUpdate('scan-paused')
    }
  }

  /**
   * Resume scanning
   */
  public async resumeScan(): Promise<void> {
    if (this.scanProgress.status === 'paused') {
      console.log('Resuming scan')
      this.scanProgress.status = 'scanning'

      // Resume current scanner progress
      const currentScannerId = this.scanProgress.currentScannerId
      if (currentScannerId && this.scanProgress.scannerProgresses[currentScannerId]) {
        this.scanProgress.scannerProgresses[currentScannerId].status = 'scanning'
      }

      this.notifyProgressUpdate('scan-resumed')

      try {
        // Process remaining folders for current scanner
        if (this.currentScannerConfig) {
          await this.processPendingFolders()
        }

        // Use loop to process remaining scanners
        while (
          this.scanProgress.status === 'scanning' &&
          this.scanProgress.processedScanners < this.scanProgress.totalScanners
        ) {
          // Find next unprocessed scanner
          const nextScannerId =
            this.scanProgress.scannersToProcess[this.scanProgress.processedScanners]
          if (!nextScannerId) break

          try {
            // Get global scanner configuration
            const scannerConfig = await this.getGlobalScannerConfig()
            if (!scannerConfig.list || !scannerConfig.list[nextScannerId]) {
              throw new Error(`Scanner configuration not found: ${nextScannerId}`)
            }

            const config = scannerConfig.list[nextScannerId]
            this.currentScannerConfig = {
              ...config,
              id: nextScannerId
            }
            this.scanProgress.currentScannerId = nextScannerId
            await this.scanDirectory(this.currentScannerConfig, scannerConfig.ignoreList)
            this.scanProgress.processedScanners++
          } catch (error) {
            console.error(`Failed to process scanner:`, error)
            this.scanProgress.status = 'error'
            this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
            this.notifyProgressUpdate('scan-error')
            break
          }
        }

        // Check if all scanners are completed
        if (
          this.scanProgress.status === 'scanning' &&
          this.scanProgress.processedScanners >= this.scanProgress.totalScanners
        ) {
          this.scanProgress.status = 'completed'
          this.notifyProgressUpdate('scan-completed')

          // Update last scan time
          this.lastScanTime = Date.now()
        }
      } catch (error) {
        console.error(`Resume scanning failed:`, error)
        this.scanProgress.status = 'error'
        this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
        this.notifyProgressUpdate('scan-error')
      }
    }
  }

  /**
   * Stop scanning
   */
  public stopScan(): void {
    if (this.scanProgress.status === 'scanning' || this.scanProgress.status === 'paused') {
      console.log('Stopping scan')
      this.scanProgress.status = 'idle'

      // Stop progress for all scanners
      for (const scannerId in this.scanProgress.scannerProgresses) {
        this.scanProgress.scannerProgresses[scannerId].status = 'idle'
      }

      // Reset current scanner config
      this.currentScannerConfig = null

      this.notifyProgressUpdate('scan-stopped')
    }
  }

  /**
   * Process remaining folders
   */
  private async processPendingFolders(): Promise<void> {
    if (!this.currentScannerConfig) {
      throw new Error('Current scanner configuration does not exist')
    }

    const scannerId = this.currentScannerConfig.id
    const scannerProgress = this.scanProgress.scannerProgresses[scannerId]
    if (!scannerProgress) {
      throw new Error('Current scanner progress does not exist')
    }

    // Get unprocessed folders
    const pendingFolders = scannerProgress.foldersToProcess.slice(scannerProgress.processedFolders)

    try {
      for (let i = 0; i < pendingFolders.length; i++) {
        // Check status at the beginning of each loop
        if (this.scanProgress.status !== 'scanning') {
          console.log(
            `Resume scanning ${this.scanProgress.status === 'paused' ? 'paused' : 'stopped'}`
          )
          return
        }

        const folderPath = pendingFolders[i]
        const folderName = path.basename(folderPath)

        scannerProgress.currentFolder = folderPath
        this.notifyProgressUpdate('scan-progress')

        try {
          // Check if game already exists
          const gameExists = await GameDBManager.checkGameExitsByPath(folderPath)

          if (!gameExists) {
            // Check status again
            if (this.scanProgress.status !== 'scanning') {
              return
            }

            // Add game
            await this.addGameByFolderName(this.currentScannerConfig.dataSource, {
              name: folderName,
              dirPath: folderPath
            })

            // Check status again during wait
            if (this.scanProgress.status !== 'scanning') {
              return
            }

            await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds
          }

          scannerProgress.scannedGames++
          this.scanProgress.scannedGames++
        } catch (error) {
          // Record failed folder
          scannerProgress.failedFolders.push({
            path: folderPath,
            name: folderName,
            error: error instanceof Error ? error.message : String(error),
            dataSource: this.currentScannerConfig.dataSource
          })
          this.notifyProgressUpdate('scan-folder-error')
        }

        // Update progress
        scannerProgress.processedFolders++
        this.notifyProgressUpdate('scan-progress')
      }

      // Only update status when normally completed all folders and status is scanning
      if (this.scanProgress.status === 'scanning') {
        // Check if completed
        if (scannerProgress.processedFolders >= scannerProgress.totalFolders) {
          scannerProgress.status = 'completed'

          // Check if all scanners are completed
          const allCompleted = Object.values(this.scanProgress.scannerProgresses).every(
            (progress) => progress.status === 'completed' || progress.status === 'error'
          )

          if (allCompleted) {
            this.scanProgress.status = 'completed'
            this.notifyProgressUpdate('scan-completed')
          }
        }
      }
    } catch (error) {
      scannerProgress.status = 'error'
      scannerProgress.errorMessage = error instanceof Error ? error.message : String(error)
      this.scanProgress.status = 'error'
      this.scanProgress.errorMessage = error instanceof Error ? error.message : String(error)
      this.notifyProgressUpdate('scan-error')
    }
  }

  /**
   * Fix failed folder
   */
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

      // Add game with provided game ID
      await addGameToDatabase({
        dataSource,
        dataSourceId: gameId,
        dirPath: folderPath
      })

      // Remove from failed list
      const scannerProgress = this.scanProgress.scannerProgresses[foundScannerId]
      scannerProgress.failedFolders.splice(foundIndex, 1)
      scannerProgress.scannedGames++
      this.scanProgress.scannedGames++
      this.notifyProgressUpdate('scan-folder-fixed')
    } catch (error) {
      console.error('Fix folder failed:', error)
      throw error
    }
  }

  /**
   * Notify render process of progress update
   */
  private notifyProgressUpdate(event: string): void {
    // Check if throttling needed (except for specific important events)
    const now = Date.now()
    const importantEvents = [
      'scan-start',
      'scan-completed',
      'scan-error',
      'scan-paused',
      'scan-resumed',
      'scan-stopped'
    ]

    if (!importantEvents.includes(event) && now - this.lastNotifyTime < this.notifyThrottleTime) {
      return // Skip non-important events within throttle time
    }

    this.lastNotifyTime = now

    // Use safe queue method to send messages
    this.queueMessage(event, { ...this.scanProgress })
  }

  // Add message to queue
  private queueMessage(event: string, data: any): void {
    this.messageQueue.push({ event, data })
    if (!this.isProcessingQueue) {
      this.processMessageQueue()
    }
  }

  // Process message queue asynchronously
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true

    while (this.messageQueue.length > 0) {
      try {
        const message = this.messageQueue[0]
        const windows = BrowserWindow.getAllWindows()

        if (windows.length > 0) {
          const mainWindow = windows[0]
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
            mainWindow.webContents.send(`game-scanner:${message.event}`, message.data)
          }
        }

        // Remove processed message
        this.messageQueue.shift()

        // Give render process time to process
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        console.error('Error processing message queue:', error)
        this.messageQueue.shift() // Remove problematic message
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * Get current scan progress
   */
  public getScanProgress(): OverallScanProgress {
    return { ...this.scanProgress }
  }

  /**
   * Start periodic scan
   */
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

      // Check if valid scan interval is set
      if (!interval || interval <= 0) {
        console.log('No valid scan interval set, cannot start periodic scan')
        return
      }

      // Ensure interval is at least 5 minutes to prevent frequent scanning
      const safeInterval = Math.max(interval, 60000 * 5)
      console.log(`Setting global periodic scan at ${safeInterval}ms`)

      // Record last scan time
      this.lastScanTime = Date.now()

      // Set global timer
      this.globalScanTimer = setInterval(async () => {
        // Skip this scan if already scanning
        if (this.scanProgress.status === 'scanning' || this.scanProgress.status === 'paused') {
          console.log(`Periodic scan triggered, but scan in progress, skipping this scan`)
          return
        }

        console.log(`Periodic global scan triggered`)
        try {
          await this.startScan()
        } catch (error) {
          console.error(`Global periodic scan failed:`, error)
        }
      }, safeInterval)

      console.log(`Global periodic scan started`)
    } catch (error) {
      console.error('Start periodic scan failed:', error)
      throw error
    }
  }

  /**
   * Stop periodic scan
   */
  public stopPeriodicScan(): boolean {
    if (this.globalScanTimer) {
      clearInterval(this.globalScanTimer)
      this.globalScanTimer = null
      console.log(`Global periodic scan stopped`)
      return true
    }
    return false
  }

  /**
   * Get periodic scan status
   */
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
