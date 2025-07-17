import { GameDBManager, ConfigDBManager } from '~/core/database'
import path from 'path'

export async function defaultPreset(gameId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')

  const mode = 'file'
  const workingDirectory = path.dirname(gamePath)
  const monitorMode = 'folder'
  const monitorPath = path.dirname(gamePath)

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    path: gamePath,
    workingDirectory,
    args: [],
    monitorMode,
    monitorPath
  })
}

export async function lePreset(gameId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')

  const mode = 'script'
  const workingDirectory = path.dirname(gamePath)
  const monitorMode = 'folder'
  const monitorPath = path.dirname(gamePath)

  const lePath = await ConfigDBManager.getConfigLocalValue('game.linkage.localeEmulator.path')
  if (!lePath) {
    throw new Error('Locale Emulator path not set')
  }
  const script = [`"${lePath}" "${gamePath}"`]

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    workingDirectory,
    command: script,
    monitorMode,
    monitorPath
  })
}

export async function steamPreset(gameId: string, steamId: string): Promise<void> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')

  const mode = 'url'
  const url = `steam://rungameid/${steamId}`
  const monitorMode = 'folder'
  const monitorPath = path.dirname(gamePath)

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    url,
    browserPath: '',
    monitorMode,
    monitorPath
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
  const monitorMode = 'folder'
  const monitorPath = path.dirname(vbaPath)

  const script = [`"${vbaPath}" "${gamePath}"`]

  await GameDBManager.setGameLocalValue(gameId, 'launcher.mode', mode)
  await GameDBManager.setGameLocalValue(gameId, `launcher.${mode}Config`, {
    workingDirectory,
    command: script,
    monitorMode,
    monitorPath
  })
}
