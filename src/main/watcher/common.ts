// discontinue

import * as chokidar from 'chokidar'
import { BrowserWindow } from 'electron'

/**
 * Watcher class
 */
export class Watcher {
  private watcher: chokidar.FSWatcher | null = null
  private path: string
  private watcherName: string
  private mainWindow: BrowserWindow
  private addtionalHandler?: () => void
  private isDestroyed = false

  constructor(
    watcherName: string,
    path: string,
    mainWindow: BrowserWindow,
    addtionalHandler?: () => void
  ) {
    this.watcherName = watcherName
    this.path = path
    this.mainWindow = mainWindow
    this.addtionalHandler = addtionalHandler

    // Listening for window close events
    this.mainWindow.on('closed', () => {
      this.stop()
    })
  }

  start(): void {
    if (this.isDestroyed) {
      console.log(`${this.watcherName} has been destroyed`)
      return
    }

    if (this.watcher) {
      console.log(`${this.watcherName} is already running`)
      return
    }

    try {
      this.watcher = chokidar.watch(this.path, {
        ignored: /(^|[/\\])\./, // Ignore the dot file.
        persistent: true,
        ignoreInitial: true,
        depth: 1, // Monitor nested subdirectories to level 1
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      })

      this.watcher
        .on('add', this.handleChange.bind(this))
        .on('change', this.handleChange.bind(this))
        .on('unlink', this.handleChange.bind(this))
        .on('addDir', this.handleChange.bind(this))
        .on('unlinkDir', this.handleChange.bind(this))
        .on('error', (error) => {
          console.error(`Watcher ${this.watcherName} error:`, error)
        })

      console.log(`Watching for changes in ${this.path} with name ${this.watcherName}`)
    } catch (error) {
      console.error(`Error starting watcher ${this.watcherName}:`, error)
      this.stop()
    }
  }

  stop(): void {
    this.isDestroyed = true
    if (this.watcher) {
      try {
        this.watcher.removeAllListeners()
        this.watcher.close()
        this.watcher = null
        console.log(`${this.watcherName} stopped`)
      } catch (error) {
        console.error(`Error stopping watcher ${this.watcherName}:`, error)
      }
    }
  }

  private handleChange(changedPath: string): void {
    // Checking object and window status
    if (this.isDestroyed || !this.mainWindow || this.mainWindow.isDestroyed()) {
      this.stop()
      return
    }

    try {
      console.log(`Detected change in: ${changedPath} with name ${this.watcherName}`)

      // Check if webContents are available
      if (this.mainWindow.webContents && !this.mainWindow.webContents.isDestroyed()) {
        this.mainWindow.webContents.send('reload-db-values', this.watcherName)
      }

      // Perform additional handler functions
      if (this.addtionalHandler && !this.isDestroyed) {
        this.addtionalHandler()
      }
    } catch (error) {
      console.error(`Error handling change in ${this.watcherName}:`, error)
      // If an error occurs, consider whether you need to stop listening
      if (error instanceof Error && error.message.includes('destroyed')) {
        this.stop()
      }
    }
  }

  // Add checking method
  isWatching(): boolean {
    return !this.isDestroyed && this.watcher !== null
  }
}
