import { GameMonitor } from './common'
import log from 'electron-log/main.js'

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
