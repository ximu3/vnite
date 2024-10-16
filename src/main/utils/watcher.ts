import * as chokidar from 'chokidar'
import { ipcMain } from 'electron'

export class Watcher {
  private watcher: chokidar.FSWatcher | null = null
  private path: string
  private watcherName: string

  constructor(watcherName: string, path: string) {
    this.watcherName = watcherName
    this.path = path
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
    console.log(`Detected change in: ${changedPath}`)
    // 发送 IPC 消息到主进程
    ipcMain.emit(`${this.watcherName}-changed`, changedPath)
  }
}
