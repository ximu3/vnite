import path from 'path'
import fse from 'fs-extra'
import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron'
import { setDBValue, getDBValue } from '~/database'
import log from 'electron-log/main.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import { backupGameSaveData } from '~/database'

const execAsync = promisify(exec)

async function getProcessList(): Promise<
  Array<{ name: string; pid: number; executablePath: string; cmd: string }>
> {
  const { stdout } = await execAsync(
    'wmic process get ExecutablePath,ProcessId,CommandLine /format:csv'
  )
  return stdout
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [, executablePath, commandLine, pid] = line.split(',')
      return {
        name: executablePath ? path.basename(executablePath) : '',
        cmd: commandLine || '',
        pid: Number(pid),
        executablePath: executablePath || ''
      }
    })
}

interface GameMonitorOptions {
  target: string
  gameId: string
  checkInterval?: number
  executableExtensions?: string[]
}

interface MonitoredProcess {
  path: string
  isRunning: boolean
  pid?: number
}

interface GameStatus {
  gameId: string
  isRunning: boolean
  processes: MonitoredProcess[]
  startTime?: string // ISO 格式的开始时间
  endTime?: string // ISO 格式的结束时间
}

export class GameMonitor {
  private options: Required<GameMonitorOptions>
  private isRunning: boolean = false
  private intervalId?: NodeJS.Timeout
  private monitoredProcesses: MonitoredProcess[] = []
  private ipcHandler?: (event: IpcMainEvent, gameId: string) => void
  private startTime?: string
  private endTime?: string

  constructor(options: GameMonitorOptions) {
    this.options = {
      checkInterval: 2000,
      executableExtensions: ['.exe', '.bat', '.cmd'],
      ...options
    }

    this.setupIpcListener()
  }

  private setupIpcListener(): void {
    this.ipcHandler = async (_, gameId: string): Promise<void> => {
      if (gameId === this.options.gameId) {
        await this.terminateProcesses()
        await this.handleGameExit()
        this.stop()
      }
    }
    ipcMain.on('stop-game', this.ipcHandler)
  }

  private cleanupIpcListener(): void {
    if (this.ipcHandler) {
      ipcMain.removeListener('stop-game', this.ipcHandler)
      this.ipcHandler = undefined
    }
  }

  private async terminateProcesses(): Promise<void> {
    for (const monitored of this.monitoredProcesses) {
      if (monitored.isRunning && monitored.pid) {
        await this.terminateProcess(monitored)
      }
    }
  }

  private async terminateProcess(process: MonitoredProcess): Promise<boolean> {
    if (!process.pid) return false

    try {
      await execAsync(`taskkill /PID ${process.pid} /F`)
      console.log(`进程 ${process.pid} 已终止.`)
      return true
    } catch (error) {
      const errorMessage = (error as any)?.message?.toLowerCase() || ''
      if (errorMessage.includes('不存在') || errorMessage.includes('找不到')) {
        console.log(`进程 ${process.pid} 已经不存在`)
        return true
      }
      console.error(`无法终止进程 ${process.pid}:`, error)
      return false
    }
  }

  public async init(): Promise<void> {
    try {
      const stat = await fse.stat(this.options.target)

      if (stat.isDirectory()) {
        const files = await this.getExecutableFiles(this.options.target)
        this.monitoredProcesses = files.map((file) => ({
          path: file,
          isRunning: false
        }))
      } else {
        this.monitoredProcesses = [
          {
            path: this.options.target,
            isRunning: false
          }
        ]
      }
    } catch (error) {
      log.error(`游戏 ${this.options.gameId} 监控初始化错误:`, error)
    }
  }

  private async getExecutableFiles(dirPath: string): Promise<string[]> {
    const executableFiles: string[] = []
    const extensions = this.options.executableExtensions

    const scan = async (currentPath: string): Promise<void> => {
      const entries = await fse.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          await scan(fullPath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (extensions.includes(ext)) {
            executableFiles.push(fullPath)
          }
        }
      }
    }

    await scan(dirPath)
    return executableFiles
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    if (this.monitoredProcesses.length === 0) {
      await this.init()
    }

    this.isRunning = true
    // 记录开始时间
    this.startTime = new Date().toISOString()
    this.endTime = undefined

    await this.checkProcesses()

    this.intervalId = setInterval(async () => {
      await this.checkProcesses()
    }, this.options.checkInterval)

    log.info(`开始监控游戏 ${this.options.gameId}`)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    // 如果是手动停止且没有结束时间，记录结束时间
    if (this.isRunning && !this.endTime) {
      this.endTime = new Date().toISOString()
    }

    this.isRunning = false
    this.cleanupIpcListener()
  }

  private async checkProcesses(): Promise<void> {
    try {
      const processes = await getProcessList() // 使用之前定义的 getProcessList 函数
      const previousStates = this.monitoredProcesses.map((p) => p.isRunning)

      // 更新所有进程的运行状态
      for (const monitored of this.monitoredProcesses) {
        const processInfo = processes.find(
          (proc) =>
            proc.executablePath.toLowerCase() === monitored.path.toLowerCase() ||
            (proc.cmd && proc.cmd.includes(monitored.path))
        )

        monitored.isRunning = !!processInfo
        if (processInfo) {
          monitored.pid = processInfo.pid
        }
      }

      // 检查是否所有进程都已停止
      const allStopped = this.monitoredProcesses.every((p) => !p.isRunning)
      const wasSomeRunning = previousStates.some((state) => state)

      if (allStopped && wasSomeRunning) {
        this.handleGameExit()
      }
    } catch (error) {
      console.error('进程检查错误:', error)
    }
  }

  private async handleGameExit(): Promise<void> {
    log.info(`游戏 ${this.options.gameId} 退出`)

    // 记录结束时间
    this.endTime = new Date().toISOString()

    const windows = BrowserWindow.getAllWindows()
    for (const window of windows) {
      window.webContents.send('game-exit', this.options.gameId)
    }

    const timer = await getDBValue(`games/${this.options.gameId}/record.json`, ['timer'], [{}])
    timer.push({
      start: this.startTime,
      end: this.endTime
    })
    await setDBValue(`games/${this.options.gameId}/record.json`, ['timer'], timer)
    await setDBValue(`games/${this.options.gameId}/record.json`, ['lastRunDate'], this.endTime)

    // 停止监控
    this.stop()

    const savePathMode = await getDBValue(
      `games/${this.options.gameId}/path.json`,
      ['savePath', 'mode'],
      'folder'
    )
    const savePath = await getDBValue(
      `games/${this.options.gameId}/path.json`,
      ['savePath', savePathMode],
      ['']
    )

    if (savePath.length > 0 && savePath[0] !== '') {
      await backupGameSaveData(this.options.gameId)
    }
  }

  public getStatus(): GameStatus {
    return {
      gameId: this.options.gameId,
      isRunning: this.isRunning,
      processes: [...this.monitoredProcesses],
      startTime: this.startTime,
      endTime: this.endTime
    }
  }
}
