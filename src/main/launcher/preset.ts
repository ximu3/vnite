import { setDBValue, getDBValue } from '~/database'
import path from 'path'

export async function defaultPreset(gameId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')

  const mode = 'file'
  const workingDirectory = path.dirname(gamePath)
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  await setDBValue(`games/${gameId}/launcher.json`, ['mode'], mode)
  await setDBValue(`games/${gameId}/launcher.json`, [`${mode}Config`], {
    path: gamePath,
    workingDirectory,
    timerMode,
    timerPath
  })
}

export async function lePreset(gameId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')

  const mode = 'script'
  const workingDirectory = path.dirname(gamePath)
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  const lePath = await getDBValue(
    'config.json',
    ['advanced', 'linkage', 'localeEmulator', 'path'],
    ''
  )
  if (!lePath) {
    throw new Error('Locale Emulator path not set')
  }
  const script = [`"${lePath}" "${gamePath}"`]

  await setDBValue(`games/${gameId}/launcher.json`, ['mode'], mode)
  await setDBValue(`games/${gameId}/launcher.json`, [`${mode}Config`], {
    workingDirectory,
    timerMode,
    timerPath,
    command: script
  })
}

export async function steamPreset(gameId: string, steamId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')

  const mode = 'url'
  const url = `steam://rungameid/${steamId}`
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  await setDBValue(`games/${gameId}/launcher.json`, ['mode'], mode)
  await setDBValue(`games/${gameId}/launcher.json`, [`${mode}Config`], {
    url,
    timerMode,
    timerPath
  })
}

export async function vbaPreset(gameId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')
  const vbaPath = await getDBValue(
    'config.json',
    ['advanced', 'linkage', 'visualBoyAdvance', 'path'],
    ''
  )

  if (!vbaPath) {
    throw new Error('VisualBoyAdvance path not set')
  }

  const mode = 'script'
  const workingDirectory = path.dirname(vbaPath)
  const timerMode = 'folder'
  const timerPath = path.dirname(vbaPath)

  const script = [`"${vbaPath}" "${gamePath}"`]

  await setDBValue(`games/${gameId}/launcher.json`, ['mode'], mode)
  await setDBValue(`games/${gameId}/launcher.json`, [`${mode}Config`], {
    workingDirectory,
    timerMode,
    timerPath,
    command: script
  })
}
