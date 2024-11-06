import fse from 'fs-extra'
import { getDataPath } from '~/utils'

export async function deleteGame(gameId: string): Promise<void> {
  const gameDBPath = await getDataPath(`games/${gameId}/`)
  if (gameDBPath) {
    await fse.remove(gameDBPath)
  }
}
