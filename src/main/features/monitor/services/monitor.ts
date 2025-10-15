import path from 'path'
import fse from 'fs-extra'
import { ipcMain, BrowserWindow } from 'electron'
import { simulateHotkey } from '~/utils'
import { updateRecentGamesInTray } from '~/features/system'
import { GameDBManager, ConfigDBManager } from '~/core/database'
import log from 'electron-log/main.js'
import { backupGameSave } from '~/features/game'
import { isEqual } from 'lodash'
import { spawn } from 'child_process'
import { psManager } from '~/utils'
import { ipcManager } from '~/core/ipc'
import { eventBus } from '~/core/events'
import { ActiveGameInfo } from '~/features/game'
import { Mutex } from 'async-mutex'

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
  private stopping: boolean = false
  // a mutex for operations which need to write `monitoredProcesses`
  private mutex: Mutex

  constructor(options: GameMonitorOptions) {
    this.options = {
      checkInterval: 5000,
      executableExtensions: ['.exe', '.bat', '.cmd'],
      magpieHotkey: 'win+alt+a',
      ...options
    }
    this.mutex = new Mutex()
    this.setupIpcListener()
  }

  private setupIpcListener(): void {
    this.ipcHandler = async (
      _event: Electron.IpcMainInvokeEvent,
      gameId: string
    ): Promise<void> => {
      if (this.exiting || gameId !== this.options.gameId || this.stopping) {
        return
      }
      this.stopping = true
      await this.terminateProcesses()
    }
    ipcMain.handle(`stop-game-${this.options.gameId}`, this.ipcHandler)
  }

  private cleanupIpcListener(): void {
    if (this.ipcHandler) {
      ipcMain.removeHandler(`stop-game-${this.options.gameId}`)
      this.ipcHandler = undefined
    }
  }

  private async terminateProcesses(): Promise<void> {
    for (const monitored of this.monitoredProcesses) {
      if (monitored.isRunning) {
        await this.terminateProcess(monitored)
      }
    }
    this.handleGameExit()
  }

  private async terminateProcess(process: MonitoredProcess): Promise<boolean> {
    try {
      const isProcessNameMode = process.isProcessNameMode === true

      if (isProcessNameMode) {
        // Process name mode, use the process name directly
        const processName = process.path
        console.log(`Try to terminate process by name: ${processName}`)

        try {
          // Use PowerShell to terminate the process by name
          const psCommand = `Get-Process -Name "${processName.replace('.exe', '')}" | Stop-Process -Force`
          await psManager.executeCommand(psCommand)
          console.log(`Process ${processName} has been terminated successfully.`)
          return true
        } catch (error) {
          const errorMessage = (error as any)?.message?.toLowerCase() || ''

          // If the process does not exist, consider it terminated successfully
          if (
            errorMessage.includes('不存在') ||
            errorMessage.includes('找不到') ||
            errorMessage.includes('no process') ||
            errorMessage.includes('cannot find a process')
          ) {
            console.log(`Process ${processName} does not exist anymore.`)
            return true
          }

          console.error(`Failed to terminate process ${processName}:`, error)
          return false
        }
      } else {
        // Normalize the path
        const normalizedPath = this.normalizePath(process.path)
        const processName = path.basename(normalizedPath)

        console.log(`Try to terminate process: ${normalizedPath}`)

        try {
          // Use PowerShell to terminate the process by exact path
          const psCommand = `Get-Process | Where-Object {$_.Path -eq '${normalizedPath}'} | Stop-Process -Force`
          await psManager.executeCommand(psCommand)
          console.log(`Process ${processName} has been terminated successfully.`)
          return true
        } catch (error) {
          const errorMessage = (error as any)?.message?.toLowerCase() || ''

          // If the process does not exist, consider it terminated successfully
          if (
            errorMessage.includes('不存在') ||
            errorMessage.includes('找不到') ||
            errorMessage.includes('no process') ||
            errorMessage.includes('cannot find') ||
            errorMessage.includes('没有找到进程')
          ) {
            console.log(`Process ${processName} does not exist anymore.`)
            return true
          }

          console.error(`Failed to terminate process ${processName}:`, error)
          return false
        }
      }
    } catch (error) {
      console.error('Failed to terminate process:', error)
      return false
    }
  }

  public async init(): Promise<void> {
    try {
      await this.mutex.runExclusive(async () => {
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
      })
    } catch (error) {
      log.error(`[Monitor] Failed to initialize monitor for game ${this.options.gameId}:`, error)
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

  // Compare the given gameId with its own
  public isGame(gameId: string): boolean {
    return this.options.gameId === gameId
  }

  // Imitate monitoring behaviours to preserve compatibility.
  // This function may be invoked multiple times in a single GameMonitor object if the
  // monitoring mode is `folder` and there are more than one executables inside that folder
  // are launched.
  public async phantomStart(gameId: string, fullpath: string, pid: number): Promise<void> {
    await this.mutex.runExclusive(async () => {
      if (this.monitoredProcesses.some((process) => process.pid === pid)) {
        return
      }
      const monitoredProcess = {
        path: fullpath,
        pid: pid,
        isRunning: true,
        isScaled: false
      }
      this.isRunning = true
      this.startTime = new Date().toISOString()
      this.endTime = undefined

      ActiveGameInfo.updateGameInfo(gameId, {
        pid: pid,
        path: fullpath
      })

      // Check if Magpie scaling is enabled
      const useMagpie = await GameDBManager.getGameLocalValue(gameId, 'launcher.useMagpie')
      const magpiePath = await ConfigDBManager.getConfigLocalValue('game.linkage.magpie.path')

      if (useMagpie && !monitoredProcess.isScaled && magpiePath) {
        await startMagpie()
        // Wait a while for the game window to fully load
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // Simulate pressing the Magpie shortcut
        const magpieHotkey = await ConfigDBManager.getConfigLocalValue('game.linkage.magpie.hotkey')
        simulateHotkey(magpieHotkey)
        monitoredProcess.isScaled = true
      }

      this.monitoredProcesses.push(monitoredProcess)
    })
  }

  // Imitate monitoring behaviours to preserve compatibility.
  // This function may be invoked multiple times in a single GameMonitor object if the
  // monitoring mode is `folder` and there are more than one executables inside that folder
  // are terminated.
  // Return `true` if all the processes are stopped, `false` if there are still some processes
  // keep running.
  public async phantomStop(pid: number): Promise<boolean> {
    const isAllExited = await this.mutex.runExclusive(() => {
      const process = this.monitoredProcesses.find((process) => process.pid === pid)
      if (process) {
        process.isRunning = false
      }
      // if all monitored processes are stopped
      if (
        this.monitoredProcesses.length === 0 ||
        this.monitoredProcesses.every((x) => !x.isRunning)
      ) {
        this.handleGameExit()
        return true
      }
      return false
    })
    return isAllExited
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

    ActiveGameInfo.updateGameInfo(this.options.gameId)

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
    if (this.stopping || this.exiting) {
      return
    }
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
          ActiveGameInfo.updateGameInfo(this.options.gameId, {
            pid: processInfo.pid,
            name: processInfo.name,
            path: processInfo.executablePath
          })
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
      log.error('[Monitor] Process checking error:', error)
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

  // Do not require mutex in this method, this will result in a dead lock
  private async handleGameExit(): Promise<void> {
    if (this.exiting) {
      return
    }

    this.exiting = true

    log.info(`Game ${this.options.gameId} Exit`)

    ActiveGameInfo.removeGameInfo(this.options.gameId)

    // Record end time
    this.endTime = new Date().toISOString()

    const mainWindow = BrowserWindow.getAllWindows()[0]

    mainWindow.show()
    mainWindow.focus()

    ipcManager.send('game:exiting', this.options.gameId)

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

  public getMonitorPath(): string {
    return this.options.config.path
  }
}
