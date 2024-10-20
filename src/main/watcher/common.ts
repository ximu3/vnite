import * as chokidar from 'chokidar'
import { BrowserWindow } from 'electron'

export class Watcher {
  private watcher: chokidar.FSWatcher | null = null
  private path: string
  private watcherName: string
  private mainWindow: BrowserWindow

  constructor(watcherName: string, path: string, mainWindow: BrowserWindow) {
    this.watcherName = watcherName
    this.path = path
    this.mainWindow = mainWindow
  }

  start(): void {
    if (this.watcher) {
      console.log(`${this.watcherName} is already running`)
      return
    }

    this.watcher = chokidar.watch(this.path, {
      ignored: /(^|[/\\])\./, // 忽略点文件
      persistent: true,
      ignoreInitial: true,
      depth: 5 // 监控嵌套子目录到2层
    })

    this.watcher
      .on('add', this.handleChange.bind(this))
      .on('change', this.handleChange.bind(this))
      .on('unlink', this.handleChange.bind(this))
      .on('addDir', this.handleChange.bind(this))
      .on('unlinkDir', this.handleChange.bind(this))

    console.log(`Watching for changes in ${this.path} with name ${this.watcherName}`)
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
      console.log(`${this.watcherName} stopped`)
    }
  }

  private handleChange(changedPath: string): void {
    console.log(`Detected change in: ${changedPath} with name ${this.watcherName}`)
    this.mainWindow.webContents.send('rebuild-index')
    this.mainWindow.webContents.send('reload-db-values', this.watcherName)
  }
}
