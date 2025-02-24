import { GameMonitor } from './common'
import log from 'electron-log/main.js'

/**
 * Start monitoring a game
 * @param gameId The id of the game
 * @param target The target to monitor
 */
export function startMonitor(gameId: string, target: string): void {
  try {
    const monitor = new GameMonitor({
      gameId,
      target
    })
    monitor.init()
    monitor.start()
  } catch (error) {
    log.error(`Failed to start monitor ${gameId}`, error)
  }
}
