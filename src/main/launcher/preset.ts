import { setDBValue, getDBValue } from '~/database'
import path from 'path'

export async function defaultPreset(gameId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')

  const mode = 'file'
  const workingDirectory = path.dirname(gamePath)
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  await setDBValue(`games/${gameId}/launcher.json`, ['mode'], mode)
  await setDBValue(`games/${gameId}/launcher.json`, [mode], {
    path: gamePath,
    workingDirectory,
    timerMode,
    timerPath
  })
}
