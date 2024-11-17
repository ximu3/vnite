import path from 'path'
import fse from 'fs-extra'
import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron'
import { setDBValue, getDBValue } from '~/database'
import log from 'electron-log/main.js'
import { backupGameSaveData } from '~/database'
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { getAppTempPath } from '~/utils'

const execAsync = (command: string, options?: any): Promise<{ stdout: string; stderr: string }> => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
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
  // 创建临时 PS1 脚本文件
  const scriptContent = `
    # 设置输出编码为 UTF-8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

    $processes = Get-Process | Select-Object Name, Id, Path, CommandLine
    $processes | ForEach-Object {
      $obj = @{
        Name = $_.Name
        Id = $_.Id
        Path = $_.Path
        CommandLine = $_.CommandLine
      }
      $obj | ConvertTo-Json -Compress
    }
  `

  const tempScriptPath = getAppTempPath(`get-process-${uuidv4()}.ps1`)

  try {
    // 写入临时脚本文件
    await fse.writeFile(tempScriptPath, scriptContent, { encoding: 'utf8' })

    // 执行 PowerShell 脚本
    const { stdout } = await execAsync(
      `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempScriptPath}"`,
      { encoding: 'utf8' }
    )

    // 解析输出结果
    const processes = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch (e) {
          console.error('解析进程信息失败:', { line, error: e })
          return null
        }
      })
      .filter((proc): proc is NonNullable<typeof proc> => proc !== null)
      .map((proc) => ({
        name: proc.Name || '',
        pid: proc.Id || 0,
        executablePath: proc.Path || '',
        cmd: proc.CommandLine || proc.Path || ''
      }))

    // console.debug('进程列表示例:', {
    //   总数: processes.length,
    //   示例: processes.slice(0, 2)
    // })

    return processes
  } catch (error) {
    console.error('PowerShell 脚本执行失败，尝试使用 WMIC:', error)

    // 回退到 WMIC 方案
    const { stdout } = await execAsync(
      'wmic process get ExecutablePath,ProcessId,CommandLine,Name /FORMAT:CSV',
      { shell: 'cmd.exe' }
    )

    return stdout
      .split('\n')
      .slice(1)
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
              .replace(/^["']|["']$/g, '')
              .replace(/\\+/g, '\\') || ''
        }
      })
  } finally {
    // 清理临时脚本文件
    try {
      await fse.remove(tempScriptPath)
    } catch (e) {
      console.error('清理临时脚本文件失败:', e)
    }
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
    const maxRetries = 3
    const retryDelay = 1000 // 1秒

    for (const monitored of this.monitoredProcesses) {
      if (monitored.isRunning && monitored.pid) {
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
    if (!process.pid) return false

    const methods = [
      // 方法1: 使用WMIC
      async (): Promise<void> => {
        await execAsync(`wmic process where ProcessId=${process.pid} call terminate`)
      },
      // 方法2: 使用taskkill终止进程树
      async (): Promise<void> => {
        await execAsync(`taskkill /F /PID ${process.pid}`)
      },
      // 方法3: 使用taskkill
      async (): Promise<void> => {
        await execAsync(`taskkill /T /F /PID ${process.pid}`)
      },
      // 方法4: 使用PowerShell
      async (): Promise<void> => {
        await execAsync(`powershell -Command "Stop-Process -Id ${process.pid} -Force"`)
      }
    ]

    for (const method of methods) {
      try {
        await method()
        console.log(`进程 ${process.pid} 已成功终止`)
        return true
      } catch (error) {
        const errorMessage = (error as any)?.message?.toLowerCase() || ''

        // 如果进程已经不存在，认为终止成功
        if (
          errorMessage.includes('不存在') ||
          errorMessage.includes('找不到') ||
          errorMessage.includes('no process') ||
          errorMessage.includes('cannot find')
        ) {
          console.log(`进程 ${process.pid} 已经不存在`)
          return true
        }

        // 记录错误但继续尝试下一个方法
        console.warn(`使用当前方法终止进程 ${process.pid} 失败:`, error)
        continue
      }
    }

    // 如果所有方法都失败，再次检查进程是否还在运行
    try {
      const processes = await getProcessList()
      const processStillExists = processes.some((p) => p.pid === process.pid)

      if (!processStillExists) {
        console.log(`进程 ${process.pid} 已不存在，视为终止成功`)
        return true
      }
    } catch (error) {
      console.error(`检查进程 ${process.pid} 状态时出错:`, error)
    }

    console.error(`无法终止进程 ${process.pid}，所有方法都失败`)
    return false
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
      const processes = await getProcessList()
      const previousStates = this.monitoredProcesses.map((p) => p.isRunning)

      for (const monitored of this.monitoredProcesses) {
        // 规范化监控的路径
        const normalizedMonitoredPath = this.normalizePath(monitored.path)

        const processInfo = processes.find((proc) => {
          if (!proc.executablePath) return false

          // 规范化进程路径
          const normalizedExecPath = this.normalizePath(proc.executablePath)
          const normalizedCmdPath = this.normalizePath(proc.cmd)

          // 路径匹配检查
          return (
            normalizedExecPath === normalizedMonitoredPath ||
            normalizedCmdPath === normalizedMonitoredPath
          )
        })

        // 更新进程状态
        // if (processInfo) {
        //   log.info(`游戏 ${this.options.gameId} 进程 ${processInfo.pid} 正在运行`)
        // }
        monitored.isRunning = !!processInfo
        monitored.pid = processInfo?.pid || monitored.pid
      }

      // 检查游戏是否退出
      const allStopped = this.monitoredProcesses.every((p) => !p.isRunning)
      const wasSomeRunning = previousStates.some((state) => state)

      if (allStopped && wasSomeRunning) {
        await this.handleGameExit()
      }
    } catch (error) {
      log.error('进程检查错误:', error)
    }
  }

  // 添加路径规范化方法
  private normalizePath(filePath: string): string {
    try {
      return path
        .normalize(filePath)
        .toLowerCase()
        .replace(/\\+/g, '\\') // 规范化反斜杠
        .replace(/^["']|["']$/g, '') // 移除首尾引号
    } catch {
      return filePath.toLowerCase()
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
