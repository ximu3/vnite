import { spawn, ChildProcess } from 'child_process'
import log from 'electron-log/main.js'

// PowerShell实例管理器
class PowerShellManager {
  private psProcess: ChildProcess | null = null
  private isInitialized = false
  private commandQueue: Array<{
    command: string
    resolve: (value: string) => void
    reject: (error: Error) => void
  }> = []
  private isProcessing = false
  private lastUsedTime: number = 0
  private cleanupTimer: NodeJS.Timeout | null = null
  private readonly CLEANUP_TIMEOUT = 15000 // 自动清理的不活跃时间：15秒

  constructor() {
    // 构造函数
    this.updateLastUsedTime()
  }

  private updateLastUsedTime(): void {
    this.lastUsedTime = Date.now()
    this.resetCleanupTimer()
  }

  private resetCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer)
    }

    this.cleanupTimer = setTimeout(() => {
      if (Date.now() - this.lastUsedTime >= this.CLEANUP_TIMEOUT) {
        log.info('PowerShell 实例闲置15秒，正在清理')
        this.cleanup()
      }
    }, this.CLEANUP_TIMEOUT)
  }

  private async initializePowerShell(): Promise<void> {
    if (this.isInitialized && this.psProcess && !this.psProcess.killed) {
      return
    }

    try {
      // 启动持久化的 PowerShell 实例
      this.psProcess = spawn('powershell.exe', ['-NoProfile', '-Command', '-'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      })

      if (!this.psProcess.stdin || !this.psProcess.stdout) {
        throw new Error('创建 PowerShell 进程流失败')
      }

      // 设置编码
      this.psProcess.stdin.write('$null = chcp 65001\n')
      this.psProcess.stdin.write(
        '$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8\n'
      )

      this.isInitialized = true

      this.psProcess.on('error', (error) => {
        log.error('PowerShell 进程错误:', error)
        this.cleanup()
      })

      this.psProcess.on('exit', () => {
        log.info('PowerShell 进程已退出')
        this.cleanup()
      })
    } catch (error) {
      log.error('初始化 PowerShell 失败:', error)
      this.cleanup()
      throw error
    }
  }

  public async executeCommand(command: string): Promise<string> {
    this.updateLastUsedTime()
    await this.initializePowerShell()

    return new Promise((resolve, reject) => {
      this.commandQueue.push({ command, resolve, reject })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.commandQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.commandQueue.length > 0) {
      const { command, resolve, reject } = this.commandQueue.shift()!

      try {
        const result = await this.executeCommandInternal(command)
        resolve(result)
      } catch (error) {
        reject(error as Error)
      }
    }

    this.isProcessing = false
  }

  private executeCommandInternal(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.psProcess || !this.psProcess.stdin || !this.psProcess.stdout) {
        reject(new Error('PowerShell 进程不可用'))
        return
      }

      const delimiter = `---COMMAND-END-${Date.now()}---`
      let output = ''
      let errorOutput = ''

      const onData = (data: Buffer): void => {
        const text = data.toString('utf8')
        output += text

        if (text.includes(delimiter)) {
          this.psProcess!.stdout!.removeListener('data', onData)
          this.psProcess!.stderr!.removeListener('data', onError)

          // 移除分隔符
          const result = output.replace(delimiter, '').trim()
          resolve(result)
        }
      }

      const onError = (data: Buffer): void => {
        errorOutput += data.toString('utf8')
      }

      this.psProcess.stdout.on('data', onData)
      this.psProcess.stderr?.on('data', onError)

      // 执行命令并添加分隔符
      const fullCommand = `${command}; Write-Host "${delimiter}"\n`
      this.psProcess.stdin?.write(fullCommand)

      // 设置超时
      setTimeout(() => {
        this.psProcess!.stdout!.removeListener('data', onData)
        this.psProcess!.stderr!.removeListener('data', onError)

        if (errorOutput) {
          reject(new Error(`PowerShell 错误: ${errorOutput}`))
        } else {
          reject(new Error('PowerShell 命令超时'))
        }
      }, 10000) // 10秒超时
    })
  }

  private cleanup(): void {
    this.isInitialized = false

    // 清除定时器
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer)
      this.cleanupTimer = null
    }

    if (this.psProcess) {
      if (!this.psProcess.killed) {
        this.psProcess.kill()
      }
      this.psProcess = null
    }

    // 清空队列并拒绝所有待处理命令
    while (this.commandQueue.length > 0) {
      const { reject } = this.commandQueue.shift()!
      reject(new Error('PowerShell 进程已终止'))
    }
  }

  public destroy(): void {
    this.cleanup()
  }
}

// 创建并导出 PowerShell 管理器的单例实例
export const psManager = new PowerShellManager()

// 导出 PowerShell 清理函数，在应用退出时调用
export function cleanupPowerShell(): void {
  psManager.destroy()
}
