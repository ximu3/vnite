import path from 'path'
import log from 'electron-log/main.js'
import { GameDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import { startMonitor } from '../services'

interface ProcessInfo {
  name: string
  pid: number
  executablePath: string
  cmd: string
}

async function getProcessList(): Promise<ProcessInfo[]> {
  try {
    const command =
      'Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ExecutablePath,CommandLine | ConvertTo-Json'
    const { psManager } = await import('~/utils')
    const stdout = await psManager.executeCommand(command)
    const processes = JSON.parse(stdout)
    return processes.map((proc: any) => ({
      name: proc.Name || '',
      pid: proc.ProcessId || 0,
      executablePath: (proc.ExecutablePath || '')
        .replace(/^(["'])(.*)\1$/, '$2')
        .replace(/\\+/g, '\\'),
      cmd: proc.CommandLine || ''
    }))
  } catch (error) {
    log.error('[AutoMonitor] Failed to get process list:', error)
    return []
  }
}

function normalizePath(p: string): string {
  try {
    return path
      .normalize(p)
      .toLowerCase()
      .replace(/\\+/g, '\\')
      .replace(/^(["'])(.*)\1$/, '$2')
  } catch {
    return (p || '').toLowerCase()
  }
}

class AutoMonitorManager {
  private unsubscribeGameStopped: (() => void) | undefined

  private intervalId?: NodeJS.Timeout
  private running: boolean = false
  private activeGames = new Set<string>()
  private intervalMs = 10000

  public async start(): Promise<void> {
    if (this.running) return
    this.running = true

    this.unsubscribeGameStopped = eventBus.on('game:stopped', ({ gameId }) =>
      this.handleGameStopped(gameId)
    )

    await this.scanOnce()
    this.intervalId = setInterval(() => {
      this.scanOnce().catch((e) => log.error('[AutoMonitor] scan error', e))
    }, this.intervalMs)

    log.info('[AutoMonitor] Started')
  }

  private handleGameStopped(gameId: string): void {
    if (this.activeGames.has(gameId)) {
      this.activeGames.delete(gameId)
      log.info(`[AutoMonitor] Removed ${gameId} from active games after it stopped.`)
    }
  }

  public stop(): void {
    if (this.unsubscribeGameStopped) {
      this.unsubscribeGameStopped()
      this.unsubscribeGameStopped = undefined
    }
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.running = false
    this.activeGames.clear()
    log.info('[AutoMonitor] Stopped')
  }

  private async scanOnce(): Promise<void> {
    try {
      const allLocals = await GameDBManager.getAllGamesLocal()
      const processList = await getProcessList()

      for (const [gameId] of Object.entries(allLocals)) {
        // Each game has launcher.mode and corresponding config
        const launcherMode = await GameDBManager.getGameLocalValue(gameId, 'launcher.mode')
        const monitorMode = await GameDBManager.getGameLocalValue(
          gameId,
          `launcher.${launcherMode}Config.monitorMode` as any
        )
        const monitorPath = await GameDBManager.getGameLocalValue(
          gameId,
          `launcher.${launcherMode}Config.monitorPath` as any
        )

        if (!monitorMode || !monitorPath) continue
        if (this.activeGames.has(gameId)) continue

        const matched = processList.some((proc) => {
          if (String(monitorMode) === 'process') {
            return proc.name.toLowerCase() === String(monitorPath).toLowerCase()
          }
          const target = normalizePath(String(monitorPath))
          const execPath = normalizePath(proc.executablePath)
          const cmdPath = normalizePath(proc.cmd)
          if (String(monitorMode) === 'folder') {
            return execPath.startsWith(target) || cmdPath.startsWith(target)
          }
          return execPath === target || cmdPath === target
        })

        if (matched) {
          log.info(`[AutoMonitor] ${gameId} is matched`)
          try {
            await startMonitor(gameId)
            this.activeGames.add(gameId)
            log.info(`[AutoMonitor] Detected and started monitor for ${gameId}`)
          } catch (e) {
            log.error('[AutoMonitor] Failed to start monitor for', gameId, e)
          }
        }
      }
    } catch (error) {
      log.error('[AutoMonitor] scanOnce failed:', error)
    }
  }
}

export const AutoMonitor = new AutoMonitorManager()
