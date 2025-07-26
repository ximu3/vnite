import { spawn, ChildProcess } from 'child_process'
import log from 'electron-log/main'

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
  private readonly CLEANUP_TIMEOUT = 30000 // Automatic cleanup inactivity time: 30 seconds

  constructor() {
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
        log.info('[Utils] PowerShell instance idle for 30 seconds, cleaning up')
        this.cleanup()
      }
    }, this.CLEANUP_TIMEOUT)
  }

  private async initializePowerShell(): Promise<void> {
    if (this.isInitialized && this.psProcess && !this.psProcess.killed) {
      return
    }

    try {
      // Start the persistent PowerShell instance
      this.psProcess = spawn('powershell.exe', ['-NoProfile', '-Command', '-'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      })

      if (!this.psProcess.stdin || !this.psProcess.stdout) {
        throw new Error('Failed to create PowerShell process streams')
      }

      // Set encoding
      this.psProcess.stdin.write('$null = chcp 65001\n')
      this.psProcess.stdin.write(
        '$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8\n'
      )

      this.isInitialized = true

      this.psProcess.on('error', (error) => {
        log.error('[Utils] PowerShell process error:', error)
        this.cleanup()
      })

      this.psProcess.on('exit', () => {
        log.info('[Utils] PowerShell process exited')
        this.cleanup()
      })
    } catch (error) {
      log.error('[Utils] Failed to initialize PowerShell:', error)
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
        reject(new Error('PowerShell process is not available'))
        return
      }

      const delimiter = `---COMMAND-END-${Date.now()}---`
      let output = ''
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      // Process the command and add the delimiter
      const fullCommand = `${command}; Write-Host "${delimiter}"\n`
      this.psProcess.stdin?.write(fullCommand)
    })
  }

  private cleanup(): void {
    this.isInitialized = false

    // Clear the timer
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

    // Clear the queue and reject all pending commands
    while (this.commandQueue.length > 0) {
      const { reject } = this.commandQueue.shift()!
      reject(new Error('PowerShell process has been terminated'))
    }
  }

  public destroy(): void {
    this.cleanup()
  }
}

export const psManager = new PowerShellManager()

export function cleanupPowerShell(): void {
  psManager.destroy()
}
