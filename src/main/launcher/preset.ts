import { GameDBManager, ConfigDBManager } from '~/database'
import path from 'path'

export async function defaultPreset(gameId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')

  const mode = 'file'
  const workingDirectory = path.dirname(gamePath)
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    path: gamePath,
    workingDirectory,
    args: []
  })
  await GameDBManager.setGameLocalValue(gameId, 'monitor.mode', timerMode)
  await GameDBManager.setGameLocalValue(gameId, 'monitor.folderConfig', {
    path: timerPath,
    deepth: 3
  })
}

export async function lePreset(gameId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')

  const mode = 'script'
  const workingDirectory = path.dirname(gamePath)
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  const lePath = await ConfigDBManager.getConfigLocalValue('game.linkage.localeEmulator.path')
  if (!lePath) {
    throw new Error('Locale Emulator path not set')
  }
  const script = [`"${lePath}" "${gamePath}"`]

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    workingDirectory,
    command: script
  })
  await GameDBManager.setGameLocalValue(gameId, 'monitor.mode', timerMode)
  await GameDBManager.setGameLocalValue(gameId, 'monitor.folderConfig', {
    path: timerPath,
    deepth: 3
  })
}

export async function steamPreset(gameId: string, steamId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')

  const mode = 'url'
  const url = `steam://rungameid/${steamId}`
  const timerMode = 'folder'
  const timerPath = path.dirname(gamePath)

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    url,
    browserPath: ''
  })
  await GameDBManager.setGameLocalValue(gameId, 'monitor.mode', timerMode)
  await GameDBManager.setGameLocalValue(gameId, 'monitor.folderConfig', {
    path: timerPath,
    deepth: 3
  })
}

export async function vbaPreset(gameId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')
  const vbaPath = await ConfigDBManager.getConfigLocalValue('game.linkage.visualBoyAdvance.path')

  if (!vbaPath) {
    throw new Error('VisualBoyAdvance path not set')
  }

  const mode = 'script'
  const workingDirectory = path.dirname(vbaPath)
  const timerMode = 'folder'
  const timerPath = path.dirname(vbaPath)

  const script = [`"${vbaPath}" "${gamePath}"`]

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    workingDirectory,
    command: script
  })
  await GameDBManager.setGameLocalValue(gameId, 'monitor.mode', timerMode)
  await GameDBManager.setGameLocalValue(gameId, 'monitor.folderConfig', {
    path: timerPath,
    deepth: 3
  })
}
