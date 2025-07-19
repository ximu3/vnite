import path from 'path'
import fse from 'fs-extra'
import { ipcMain, BrowserWindow } from 'electron'
import { simulateHotkey } from '~/utils'
import { updateRecentGamesInTray } from '~/features/system'
import { GameDBManager, ConfigDBManager } from '~/core/database'
import log from 'electron-log/main.js'
import { backupGameSave } from '~/features/game'
import { exec } from 'child_process'
import { isEqual } from 'lodash'
import { spawn } from 'child_process'
import { psManager } from '~/utils'
import { ipcManager } from '~/core/ipc'
import { eventBus } from '~/core/events'

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
    const command =
      'Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ExecutablePath,CommandLine | ConvertTo-Json'
    const stdout = await psManager.executeCommand(command)

    const processes = JSON.parse(stdout)
    return processes.map((proc: any) => ({
      name: proc.Name || '',
      pid: proc.ProcessId || 0,
      executablePath: (proc.ExecutablePath || '').replace(/^["']|["']$/g, '').replace(/\\+/g, '\\'),
      cmd: proc.CommandLine || ''
    }))
  } catch (error) {
    console.error('Failed to get process list:', error)
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
    const magpiePath = await ConfigDBManager.getConfigLocalValue('game.linkage.magpie.path')
    if (magpiePath) {
      const isRunning = await checkIfProcessRunning('Magpie.exe')
      if (isRunning) {
        console.log('Magpie is already running.')
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
    console.error('Failed to start Magpie:', error)
  }
}

interface GameMonitorOptions {
  gameId: string
  config: {
    mode: 'file' | 'folder' | 'process'
    path: string
  }
  magpieHotkey?: string
  checkInterval?: number
  executableExtensions?: string[]
}

interface MonitoredProcess {
  path: string
  isRunning: boolean
  pid?: number
  isScaled?: boolean
  isProcessNameMode?: boolean
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
  private ipcHandler?: (_event: Electron.IpcMainInvokeEvent, gameId: string) => Promise<void>
  private startTime?: string
  private endTime?: string
  private exiting: boolean = false

  constructor(options: GameMonitorOptions) {
    this.options = {
      checkInterval: 5000,
      executableExtensions: ['.exe', '.bat', '.cmd'],
      magpieHotkey: 'win+alt+a',
      ...options
    }

    this.setupIpcListener()
  }

  private setupIpcListener(): void {
    this.ipcHandler = async (
      _event: Electron.IpcMainInvokeEvent,
      gameId: string
    ): Promise<void> => {
      if (this.exiting || gameId !== this.options.gameId) {
        return
      }
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
              console.log(
                `Failed attempt to terminate process ${monitored.pid}, ${maxRetries - retries} retries`
              )
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
          }
        }

        if (!terminated) {
          log.error(
            `Unable to terminate process ${monitored.pid}, maximum number of retries reached`
          )
          throw new Error(
            `Unable to terminate process ${monitored.pid}, maximum number of retries reached`
          )
        }
      }
    }
    this.handleGameExit()
  }

  private async terminateProcess(process: MonitoredProcess): Promise<boolean> {
    try {
      const isProcessNameMode = process.isProcessNameMode === true

      if (isProcessNameMode) {
        // Process name mode: use the process name directly
        const processName = process.path
        console.log(`Attempt to terminate process name: ${processName}`)

        try {
          // Terminate processes by name using taskkill
          await execAsync(`taskkill /F /IM "${processName}"`, {
            shell: 'cmd.exe'
          })
          console.log(`Process ${processName} has been successfully terminated.`)
          return true
        } catch (error) {
          const errorMessage = (error as any)?.message?.toLowerCase() || ''

          // If the process does not exist, the termination is considered successful
          if (
            errorMessage.includes('不存在') ||
            errorMessage.includes('找不到') ||
            errorMessage.includes('no process')
          ) {
            console.log(`The process ${processName} no longer exists.`)
            return true
          }

          console.error(`Unable to terminate process ${processName}:`, error)
          return false
        }
      } else {
        // Normalization path
        const normalizedPath = this.normalizePath(process.path)
        const processName = path.basename(normalizedPath)

        console.log(`Attempts to terminate the process: ${normalizedPath}`)

        const methods = [
          // Method 2: Exact Match by Path using PowerShell
          async (): Promise<void> => {
            const psCommand = `Get-Process | Where-Object {$_.Path -eq '${normalizedPath}'} | Stop-Process -Force`
            await psManager.executeCommand(psCommand)
          }
        ]

        for (const method of methods) {
          try {
            await method()
            console.log(`Process ${processName} has been successfully terminated.`)
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
              console.log(`The process ${processName} no longer exists.`)
              return true
            }

            // Log the error but keep trying the next method
            console.warn(`Current method to terminate process ${processName} Failed:`, error)
            continue
          }
        }

        // Finally verify that the process is still running
        const processes = await getProcessList()
        const processStillExists = processes.some(
          (p) => this.normalizePath(p.executablePath) === normalizedPath
        )

        if (!processStillExists) {
          console.log(
            `The process ${processName} no longer exists and is considered terminated successfully.`
          )
          return true
        }

        console.error(`Cannot terminate process ${processName}, all methods fail`)
        return false
      }
    } catch (error) {
      console.error('Failure to terminate the process:', error)
      return false
    }
  }

  public async init(): Promise<void> {
    try {
      if (this.options.config.mode === 'folder') {
        const files = await this.getExecutableFiles(this.options.config.path)
        this.monitoredProcesses = files.map((file) => ({
          path: file,
          isRunning: false
        }))
      } else if (this.options.config.mode === 'file') {
        this.monitoredProcesses = [
          {
            path: this.options.config.path,
            isRunning: false
          }
        ]
      } else if (this.options.config.mode === 'process') {
        this.monitoredProcesses = [
          {
            path: this.options.config.path,
            isRunning: false,
            isProcessNameMode: true // Mark as process name monitoring mode
          }
        ]
      }
    } catch (error) {
      log.error(`game ${this.options.gameId} monitor initialization errors:`, error)
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

    log.info(`Start monitoring the game ${this.options.gameId}`)
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
        // Check if it is process name monitoring mode
        const isProcessNameMode = monitored.isProcessNameMode === true

        const processInfo = processes.find((proc) => {
          if (isProcessNameMode) {
            // Match by process name
            return proc.name.toLowerCase() === monitored.path.toLowerCase()
          } else {
            if (!proc.executablePath) return false

            // Path normalization
            const normalizedMonitoredPath = this.normalizePath(monitored.path)
            const normalizedExecPath = this.normalizePath(proc.executablePath)
            const normalizedCmdPath = this.normalizePath(proc.cmd)

            // Path Matching Check
            return (
              normalizedExecPath === normalizedMonitoredPath ||
              normalizedCmdPath === normalizedMonitoredPath
            )
          }
        })

        if (processInfo) {
          console.log(
            `Game ${this.options.gameId} process ${isProcessNameMode ? processInfo.name : processInfo.executablePath} running`
          )
        }

        const wasRunning = monitored.isRunning
        monitored.isRunning = !!processInfo
        monitored.pid = processInfo?.pid || monitored.pid

        // If the process has just been started (not running before, running now)
        if (!wasRunning && monitored.isRunning) {
          console.log(`Game ${this.options.gameId} process has been started`)

          // Check if Magpie scaling is enabled
          const useMagpie = await GameDBManager.getGameLocalValue(
            this.options.gameId,
            'launcher.useMagpie'
          )

          const magpiePath = await ConfigDBManager.getConfigLocalValue('game.linkage.magpie.path')

          const magpieHotkey = await ConfigDBManager.getConfigLocalValue(
            'game.linkage.magpie.hotkey'
          )

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
      log.error('Process checking error:', error)
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
    if (this.exiting) {
      return
    }

    this.exiting = true

    log.info(`Game ${this.options.gameId} Exit`)

    // Record end time
    this.endTime = new Date().toISOString()

    const mainWindow = BrowserWindow.getAllWindows()[0]

    mainWindow.show()
    mainWindow.focus()

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

    updateRecentGamesInTray()

    const savePaths = await GameDBManager.getGameLocalValue(this.options.gameId, 'path.savePaths')

    if (!isEqual(savePaths, ['']) && savePaths.length > 0) {
      await backupGameSave(this.options.gameId)
    }

    ipcManager.send('game:exited', this.options.gameId)
    eventBus.emit(
      'game:stopped',
      {
        gameId: this.options.gameId,
        duration: playTime
      },
      { source: 'monitor' }
    )
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
