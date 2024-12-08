import * as chokidar from 'chokidar'
import { BrowserWindow } from 'electron'

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

    // 监听窗口关闭事件
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
        ignored: /(^|[/\\])\./, // 忽略点文件
        persistent: true,
        ignoreInitial: true,
        depth: 1, // 监控嵌套子目录到1层
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
    // 检查对象和窗口状态
    if (this.isDestroyed || !this.mainWindow || this.mainWindow.isDestroyed()) {
      this.stop()
      return
    }

    try {
      console.log(`Detected change in: ${changedPath} with name ${this.watcherName}`)

      // 检查 webContents 是否可用
      if (this.mainWindow.webContents && !this.mainWindow.webContents.isDestroyed()) {
        this.mainWindow.webContents.send('reload-db-values', this.watcherName)
      }

      // 执行额外的处理函数
      if (this.addtionalHandler && !this.isDestroyed) {
        this.addtionalHandler()
      }
    } catch (error) {
      console.error(`Error handling change in ${this.watcherName}:`, error)
      // 如果发生错误，考虑是否需要停止监听
      if (error instanceof Error && error.message.includes('destroyed')) {
        this.stop()
      }
    }
  }

  // 添加检查方法
  isWatching(): boolean {
    return !this.isDestroyed && this.watcher !== null
  }
}
