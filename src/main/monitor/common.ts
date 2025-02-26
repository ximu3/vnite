import path from 'path'
import fse from 'fs-extra'
import { ipcMain, BrowserWindow } from 'electron'
import { updateRecentGames, simulateHotkey } from '~/utils'
import { GameDBManager, ConfigDBManager } from '~/database'
import { gameLocalDoc } from '@appTypes/database'
import log from 'electron-log/main.js'
import { backupGameSave } from '~/database'
import { exec } from 'child_process'
import { isEqual } from 'lodash'
import { spawn } from 'child_process'

const execAsync = (command: string, options?: any): Promise<{ stdout: string; stderr: string }> => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, { ...options }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        // Convert output from GBK to UTF-8
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() })
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
    // Getting process information with PowerShell
    const { stdout } = await execAsync(
      `chcp 65001 | Out-Null; powershell -Command "Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ExecutablePath,CommandLine | ConvertTo-Json"`,
      {
        shell: 'powershell.exe',
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer for large output
      }
    )

    const processes = JSON.parse(stdout)
    return processes.map((proc: any) => ({
      name: proc.Name || '',
      pid: proc.ProcessId || 0,
      executablePath: (proc.ExecutablePath || '').replace(/^["']|["']$/g, '').replace(/\\+/g, '\\'),
      cmd: proc.CommandLine || ''
    }))
  } catch (error) {
    console.error('获取进程列表失败:', error)
    throw error
  }
}

async function checkIfProcessRunning(processName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = spawn('tasklist', ['/FI', `IMAGENAME eq ${processName}`])
    let output = ''

    cmd.stdout.on('data', (data) => {
      output += data.toString()
    })

    cmd.on('close', () => {
      resolve(output.toLowerCase().includes(processName.toLowerCase()))
    })
  })
}

async function startMagpie(): Promise<void> {
  try {
    const magpiePath = await ConfigDBManager.getConfigValue('game.linkage.magpie.path')
    if (magpiePath) {
      const isRunning = await checkIfProcessRunning('Magpie.exe')
      if (isRunning) {
        console.log('Magpie 已经在运行')
        return
      }
      const magpie = spawn('start', ['""', `"${magpiePath}" -t`], {
        shell: true,
        detached: true,
        stdio: 'ignore'
      })
      magpie.unref()
    }
  } catch (error) {
    console.error('启动 Magpie 失败:', error)
  }
}

interface GameMonitorOptions {
  gameId: string
  magpieHotkey?: string
  checkInterval?: number
  executableExtensions?: string[]
}

interface MonitoredProcess {
  path: string
  isRunning: boolean
  pid?: number
  isScaled?: boolean
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
  private config?: gameLocalDoc['monitor']
  private intervalId?: NodeJS.Timeout
  private monitoredProcesses: MonitoredProcess[] = []
  private ipcHandler?: () => void
  private startTime?: string
  private endTime?: string

  constructor(options: GameMonitorOptions) {
    this.options = {
      checkInterval: 3000,
      executableExtensions: ['.exe', '.bat', '.cmd'],
      magpieHotkey: 'win+alt+a',
      ...options
    }

    this.setupIpcListener()
  }

  private setupIpcListener(): void {
    this.ipcHandler = async (): Promise<void> => {
      await this.terminateProcesses()
    }
    ipcMain.handleOnce(`stop-game-${this.options.gameId}`, this.ipcHandler)
  }

  private cleanupIpcListener(): void {
    if (this.ipcHandler) {
      ipcMain.removeHandler(`stop-game-${this.options.gameId}`)
      this.ipcHandler = undefined
    }
  }

  private async terminateProcesses(): Promise<void> {
    const maxRetries = 3
    const retryDelay = 100

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
          throw new Error(`无法终止进程 ${monitored.pid}，已达到最大重试次数`)
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
      this.config = await GameDBManager.getGameLocalValue(this.options.gameId, 'monitor')

      if (this.config.mode === 'folder') {
        const files = await this.getExecutableFiles(this.config.folderConfig.path)
        this.monitoredProcesses = files.map((file) => ({
          path: file,
          isRunning: false
        }))
      } else if (this.config.mode === 'file') {
        this.monitoredProcesses = [
          {
            path: this.config.fileConfig.path,
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

        const wasRunning = monitored.isRunning
        monitored.isRunning = !!processInfo
        monitored.pid = processInfo?.pid || monitored.pid

        // If the process has just been started (not running before, now running)
        if (!wasRunning && monitored.isRunning) {
          console.log(`游戏 ${this.options.gameId} 进程已启动`)

          // Check if Magpie scaling is enabled
          const useMagpie = await GameDBManager.getGameLocalValue(
            this.options.gameId,
            'launcher.useMagpie'
          )

          const magpiePath = await ConfigDBManager.getConfigValue('game.linkage.magpie.path')

          const magpieHotkey = await ConfigDBManager.getConfigValue('game.linkage.magpie.hotkey')

          if (useMagpie && !monitored.isScaled && magpiePath) {
            await startMagpie()
            // Wait a while for the game window to fully load
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Simulate pressing the Magpie shortcut
            simulateHotkey(magpieHotkey)
            monitored.isScaled = true
          }
        } else if (!monitored.isRunning) {
          // Reset the zoom state if the process stops running
          monitored.isScaled = false
        }
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

    const mainWindow = BrowserWindow.getAllWindows()[0]

    mainWindow.webContents.send('game-exiting', this.options.gameId)

    const timers = await GameDBManager.getGameValue(this.options.gameId, 'record.timers')

    timers.push({
      start: this.startTime || '',
      end: this.endTime
    })
    await GameDBManager.setGameValue(this.options.gameId, 'record.timers', timers)
    await GameDBManager.setGameValue(this.options.gameId, 'record.lastRunDate', this.endTime)

    let playTime = await GameDBManager.getGameValue(this.options.gameId, 'record.playTime')
    playTime += new Date(this.endTime).getTime() - new Date(this.startTime!).getTime()
    await GameDBManager.setGameValue(this.options.gameId, 'record.playTime', playTime)

    // Stop monitoring
    this.stop()

    updateRecentGames()

    const savePaths = await GameDBManager.getGameLocalValue(this.options.gameId, 'path.savePaths')

    if (!isEqual(savePaths, ['']) && savePaths.length > 0) {
      await backupGameSave(this.options.gameId)
    }

    mainWindow.webContents.send('game-exited', this.options.gameId)
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
