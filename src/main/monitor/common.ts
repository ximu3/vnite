import path from 'path'
import fse from 'fs-extra'
import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron'
import { updateRecentGames } from '~/utils'
import { setDBValue, getDBValue } from '~/database'
import log from 'electron-log/main.js'
import { backupGameSaveData, checkPathJsonVersion } from '~/database'
import { exec } from 'child_process'
import iconv from 'iconv-lite'

const execAsync = (command: string, options?: any): Promise<{ stdout: string; stderr: string }> => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, { ...options, encoding: 'buffer' }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        // Convert output from GBK to UTF-8
        const decodedStdout = iconv.decode(stdout, 'gbk')
        resolve({ stdout: decodedStdout, stderr: stderr.toString() })
      }
    })
  })
}

async function getProcessList(): Promise<
  Array<{
    name: string
    pid: number
    executablePath: string
    cmd: string
  }>
> {
  try {
    // Execute WMIC commands
    const { stdout } = await execAsync(
      'wmic process get ExecutablePath,ProcessId,CommandLine,Name /FORMAT:CSV',
      {
        shell: 'cmd.exe'
      }
    )

    return stdout
      .split('\n')
      .slice(1) // Skip title line
      .filter(Boolean)
      .map((line) => {
        const [, executablePath, commandLine, pidStr, name] = line.split(',')
        return {
          name: name?.trim() || '',
          cmd: commandLine?.trim() || '',
          pid: parseInt(pidStr?.trim() || '0', 10),
          executablePath:
            executablePath
              ?.trim()
              .replace(/^["']|["']$/g, '') // Remove quotes
              .replace(/\\+/g, '\\') || '' // Normalized path separator
        }
      })
  } catch (error) {
    console.error('获取进程列表失败:', error)
    throw error
  }
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
  startTime?: string // Start time in ISO format
  endTime?: string // End time of ISO format
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
      checkInterval: 1000,
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
    const maxRetries = 3
    const retryDelay = 1000 // 1 second

    for (const monitored of this.monitoredProcesses) {
      if (monitored.isRunning) {
        let retries = 0
        let terminated = false

        while (retries < maxRetries && !terminated) {
          terminated = await this.terminateProcess(monitored)

          if (!terminated) {
            retries++
            if (retries < maxRetries) {
              console.log(`尝试终止进程 ${monitored.pid} 失败，${maxRetries - retries} 次重试机会`)
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
          }
        }

        if (!terminated) {
          log.error(`无法终止进程 ${monitored.pid}，已达到最大重试次数`)
        }
      }
    }
  }

  private async terminateProcess(process: MonitoredProcess): Promise<boolean> {
    try {
      // Normalization path
      const normalizedPath = this.normalizePath(process.path)
      const processName = path.basename(normalizedPath)

      console.log(`尝试终止进程: ${normalizedPath}`)

      const methods = [
        // Method 2: Exact Match by Path using PowerShell
        async (): Promise<void> => {
          const psCommand = `Get-Process | Where-Object {$_.Path -eq '${normalizedPath}'} | Stop-Process -Force`
          await execAsync(`powershell -Command "${psCommand}"`, {
            encoding: 'cp936',
            shell: 'cmd.exe'
          })
        }
      ]

      for (const method of methods) {
        try {
          await method()
          console.log(`进程 ${processName} 已成功终止`)
          return true
        } catch (error) {
          const errorMessage = (error as any)?.message?.toLowerCase() || ''

          // If the process no longer exists, termination is considered successful
          if (
            errorMessage.includes('不存在') ||
            errorMessage.includes('找不到') ||
            errorMessage.includes('no process') ||
            errorMessage.includes('cannot find') ||
            errorMessage.includes('没有找到进程')
          ) {
            console.log(`进程 ${processName} 已经不存在`)
            return true
          }

          // Log the error but keep trying the next method
          console.warn(`当前方法终止进程 ${processName} 失败:`, error)
          continue
        }
      }

      // Finally verify that the process is still running
      const processes = await getProcessList()
      const processStillExists = processes.some(
        (p) => this.normalizePath(p.executablePath) === normalizedPath
      )

      if (!processStillExists) {
        console.log(`进程 ${processName} 已不存在，视为终止成功`)
        return true
      }

      console.error(`无法终止进程 ${processName}，所有方法都失败`)
      return false
    } catch (error) {
      console.error('终止进程失败:', error)
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
            const replacedPath = fullPath.replace(/・/g, '?')
            executableFiles.push(replacedPath)
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
    // Record start time
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

    // If it was stopped manually and there is no end time, record the end time
    if (this.isRunning && !this.endTime) {
      this.endTime = new Date().toISOString()
    }

    this.isRunning = false
    this.cleanupIpcListener()
  }

  private async checkProcesses(): Promise<void> {
    try {
      const processes = await getProcessList()
      const previousStates = this.monitoredProcesses.map((p) => p.isRunning)

      for (const monitored of this.monitoredProcesses) {
        // Path to normalized monitoring
        const normalizedMonitoredPath = this.normalizePath(monitored.path)

        const processInfo = processes.find((proc) => {
          if (!proc.executablePath) return false

          // Normative process pathway
          const normalizedExecPath = this.normalizePath(proc.executablePath)
          const normalizedCmdPath = this.normalizePath(proc.cmd)

          // Path Matching Check
          return (
            normalizedExecPath === normalizedMonitoredPath ||
            normalizedCmdPath === normalizedMonitoredPath
          )
        })

        if (processInfo) {
          console.log(`游戏 ${this.options.gameId} 进程 ${processInfo.executablePath} 正在运行`)
        }
        monitored.isRunning = !!processInfo
        monitored.pid = processInfo?.pid || monitored.pid
      }

      // Check if the game exits
      const allStopped = this.monitoredProcesses.every((p) => !p.isRunning)
      const wasSomeRunning = previousStates.some((state) => state)

      if (allStopped && wasSomeRunning) {
        await this.handleGameExit()
      }
    } catch (error) {
      log.error('进程检查错误:', error)
    }
  }

  // Adding a path normalization method
  private normalizePath(filePath: string): string {
    try {
      return path
        .normalize(filePath)
        .toLowerCase()
        .replace(/\\+/g, '\\') // Normalized backslash
        .replace(/^["']|["']$/g, '') // Remove opening and closing quotation marks
    } catch {
      return filePath.toLowerCase()
    }
  }

  private async handleGameExit(): Promise<void> {
    log.info(`游戏 ${this.options.gameId} 退出`)

    // Record end time
    this.endTime = new Date().toISOString()

    const windows = BrowserWindow.getAllWindows()
    for (const window of windows) {
      window.webContents.send('game-exit', this.options.gameId)
    }

    type TimerRecord = {
      start: string | undefined
      end: string
    }

    const timer: TimerRecord[] = await getDBValue(
      `games/${this.options.gameId}/record.json`,
      ['timer'],
      []
    )

    timer.push({
      start: this.startTime,
      end: this.endTime
    })
    await setDBValue(`games/${this.options.gameId}/record.json`, ['timer'], timer)
    await setDBValue(`games/${this.options.gameId}/record.json`, ['lastRunDate'], this.endTime)

    let playingTime = await getDBValue(
      `games/${this.options.gameId}/record.json`,
      ['playingTime'],
      0
    )
    playingTime += new Date(this.endTime).getTime() - new Date(this.startTime!).getTime()
    await setDBValue(`games/${this.options.gameId}/record.json`, ['playingTime'], playingTime)

    // Stop monitoring
    this.stop()

    updateRecentGames()

    await checkPathJsonVersion(this.options.gameId)
    const savePath = await getDBValue<{ pathInGame: string; pathInDB: string }[]>(
      `games/${this.options.gameId}/path.json`,
      ['savePath'],
      []
    )

    if (savePath.length > 0 && savePath[0].pathInDB !== '' && savePath[0].pathInGame !== '') {
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
