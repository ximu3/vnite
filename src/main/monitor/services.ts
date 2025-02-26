import { GameMonitor } from './common'
import log from 'electron-log/main.js'

/**
 * Start monitoring a game
 * @param gameId The id of the game
 * @param target The target to monitor
 */
export async function startMonitor(gameId: string): Promise<void> {
  try {
    const monitor = new GameMonitor({
      gameId
    })
    await monitor.init()
    monitor.start()
  } catch (error) {
    log.error(`Failed to start monitor ${gameId}`, error)
  }
}
