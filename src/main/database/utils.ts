import fse from 'fs-extra'
import { getDataPath } from '~/utils'
import { removeGameIndex } from './gameIndex'
import { removeGameRecord } from './record'

export async function deleteGame(gameId: string): Promise<void> {
  const gameDBPath = await getDataPath(`games/${gameId}/`)
  if (gameDBPath) {
    await fse.emptyDir(gameDBPath)
    await fse.remove(gameDBPath)
    await removeGameRecord(gameId)
  }
  await removeGameIndex(gameId)
}
