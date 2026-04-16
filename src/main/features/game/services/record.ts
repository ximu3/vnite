import { GameDBManager } from '~/core/database'
import { updateRecentGamesInTray } from '~/features/system'
import { calculateLastRunDateFromTimers } from '@appUtils'

export async function recalculateLastRunDate(gameId: string): Promise<string> {
  const timers = await GameDBManager.getGameValue(gameId, 'record.timers')
  const lastRunDate = calculateLastRunDateFromTimers(timers)

  await GameDBManager.setGameValue(gameId, 'record.lastRunDate', lastRunDate)
  await GameDBManager.setGameValue(gameId, 'record.hideFromRecentGames', false)
  await updateRecentGamesInTray()

  return lastRunDate
}

export async function hideGameFromRecentGames(gameId: string): Promise<void> {
  await GameDBManager.setGameValue(gameId, 'record.hideFromRecentGames', true)
  await updateRecentGamesInTray()
}
