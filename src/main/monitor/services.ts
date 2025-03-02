import { GameMonitor } from './common'
import { GameDBManager } from '~/database'
import log from 'electron-log/main.js'

/**
 * Start monitoring a game
 * @param gameId The id of the game
 * @param target The target to monitor
 */
export async function startMonitor(gameId: string): Promise<void> {
  try {
    const launcherMode = await GameDBManager.getGameLocalValue(gameId, 'launcher.mode')
    const monitorMode = await GameDBManager.getGameLocalValue(
      gameId,
      `launcher.${launcherMode}Config.monitorMode`
    )
    const monitorPath = await GameDBManager.getGameLocalValue(
      gameId,
      `launcher.${launcherMode}Config.monitorPath`
    )
    const monitor = new GameMonitor({
      gameId,
      config: {
        mode: monitorMode,
        path: monitorPath
      }
    })
    await monitor.init()
    monitor.start()
  } catch (error) {
    log.error(`Failed to start monitor ${gameId}`, error)
  }
}
