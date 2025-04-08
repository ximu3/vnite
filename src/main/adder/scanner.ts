import { BrowserWindow, ipcMain } from 'electron'
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

  // Queue related properties
  private gameAddQueue: Array<{
    dataSource: string
    folder: { name: string; dirPath: string }
    scannerId: string // Add scannerId to track which scanner the folder belongs to
  }> = []
  private isProcessingGameQueue: boolean = false
  private queuedPaths: Set<string> = new Set()
  private shouldAbortQueue: boolean = false

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

    // Add method to ignore failed folder
    ipcMain.handle(
      'game-scanner:ignore-failed-folder',
      (_, scannerId: string, folderPath: string) => {
        this.ignoreFailedFolder(scannerId, folderPath)
        return this.scanProgress
      }
    )
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
      // Reset current scanner config when done
      if (this.scanProgress.status !== 'scanning') {
        this.currentScannerConfig = null
      }
    }
  }

  /**
   * Scan specific directory
   */
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
      scannerProgress.processedFolders = 0 // Initialize to 0
      this.notifyProgressUpdate('scan-progress')

      // Process each folder
      for (let i = 0; i < foldersToScan.length; i++) {
        // Check status at the beginning of each loop
        if (this.scanProgress.status !== 'scanning') {
          // If not scanning, return directly without further processing
          console.log(`Scanning stopped`)
          return
        }

        const folder = foldersToScan[i]
        scannerProgress.currentFolder = folder.dirPath
        this.notifyProgressUpdate('scan-progress')

        // Add folder to processing queue
        this.addGameToQueue(scanner.dataSource, folder, scannerId)
      }

      // Wait for queue processing to complete
      await this.waitForQueueToComplete()

      // Only set to completed if all folders processed successfully
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
   * Add game to processing queue
   */
  private addGameToQueue(
    dataSource: string,
    folder: { name: string; dirPath: string },
    scannerId: string
  ): void {
    // Check if this path is already in the queue to avoid duplication
    if (this.queuedPaths.has(folder.dirPath)) {
      console.log(`Path already in queue: ${folder.dirPath}`)
      return
    }

    // Add to queue and mark the path as queued
    this.gameAddQueue.push({ dataSource, folder, scannerId })
    this.queuedPaths.add(folder.dirPath)

    // Start processing if the queue is not being processed
    if (!this.isProcessingGameQueue) {
      this.processGameQueue()
    }
  }

  /**
   * Clear game addition queue
   */
  public clearGameQueue(): void {
    this.gameAddQueue = []
    this.queuedPaths.clear()
  }

  /**
   * Process game addition queue
   */
  private async processGameQueue(): Promise<void> {
    if (this.isProcessingGameQueue) return

    this.isProcessingGameQueue = true
    this.shouldAbortQueue = false

    try {
      while (this.gameAddQueue.length > 0 && !this.shouldAbortQueue) {
        // Exit queue processing if scanning has been stopped
        if (this.scanProgress.status !== 'scanning') {
          return
        }

        const item = this.gameAddQueue[0]
        const { dataSource, folder, scannerId } = item
        const scannerProgress = this.scanProgress.scannerProgresses[scannerId]

        try {
          // Check if the game already exists
          const gameExists = await GameDBManager.checkGameExitsByPath(folder.dirPath)

          if (!gameExists) {
            // Check status again to prevent state changes before long operations
            if (this.scanProgress.status !== 'scanning') {
              return
            }

            // Use folder name as game name for search
            const gameResults = await searchGames(dataSource, folder.name)

            if (gameResults && gameResults.length > 0) {
              // Use the first result as a match
              const match = gameResults[0]
              await addGameToDatabase({
                dataSource,
                dataSourceId: match.id,
                dirPath: folder.dirPath
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
          this.notifyProgressUpdate('scan-folder-error')
        } finally {
          // Remove from queue and set
          this.gameAddQueue.shift()
          this.queuedPaths.delete(folder.dirPath)

          // Now update processing progress - counts as one complete process regardless of success or failure
          scannerProgress.processedFolders++
          scannerProgress.currentFolder = '' // Clear the currently processing folder
          this.notifyProgressUpdate('scan-progress')

          // Operation interval delay (3 seconds)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
    } finally {
      this.isProcessingGameQueue = false
      this.shouldAbortQueue = false
    }
  }

  /**
   * Wait for queue processing to complete
   */
  private async waitForQueueToComplete(): Promise<void> {
    // Return directly if the queue is empty and not being processed
    if (this.gameAddQueue.length === 0 && !this.isProcessingGameQueue) {
      return
    }

    // Otherwise wait for queue processing to complete
    return new Promise<void>((resolve) => {
      const checkQueue = (): void => {
        if (this.gameAddQueue.length === 0 && !this.isProcessingGameQueue) {
          resolve()
        } else {
          setTimeout(checkQueue, 500) // Check every 500 milliseconds
        }
      }

      checkQueue()
    })
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
   * Stop scanning
   */
  public stopScan(): void {
    if (this.scanProgress.status === 'scanning') {
      console.log('Stopping scan')

      // Completely reset scan progress
      this.scanProgress = {
        status: 'idle',
        currentScannerId: '',
        processedScanners: 0,
        totalScanners: 0,
        scannersToProcess: [],
        scannedGames: 0,
        scannerProgresses: {}
      }

      this.clearGameQueue()

      // Reset current scanner config
      this.currentScannerConfig = null
      this.notifyProgressUpdate('scan-stopped')
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
    } catch (error) {
      console.error('Ignore failed folder failed:', error)
      throw error
    }
  }

  /**
   * Notify render process of progress update
   */
  private notifyProgressUpdate(event: string): void {
    // Check if throttling needed (except for specific important events)
    const now = Date.now()
    const importantEvents = ['scan-start', 'scan-completed', 'scan-error', 'scan-stopped']
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
        if (this.scanProgress.status === 'scanning') {
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
