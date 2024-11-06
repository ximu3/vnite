import { setValue, getValue } from './common'
import { getDataPath } from '~/utils'
import { getMetadata } from './metadata'
import { getTimerdata } from './timer'
import { backupGameSave, restoreGameSave, deleteGameSave } from './save'
import { deleteGame } from './utils'
import log from 'electron-log/main.js'

/**
 * Get the value of the database
 * @param dbName The name of the database
 * @param path The path to the key.
 * @param value — The value to set.
 * @returns A promise that resolves when the operation is complete.
 */
export async function setDBValue(dbName: string, path: string[], value: any): Promise<void> {
  try {
    await setValue(await getDataPath(dbName), path, value)
  } catch (error) {
    log.error(`Failed to set value for ${dbName} at ${path.join('.')}`, error)
  }
}

/**
 * Get the value of the database
 * @param dbName The name of the database
 * @param path The path to the key.
 * @param defaultValue The default value to set and return if the key does not exist.
 * @returns A promise that resolves with the value of the key.
 */
export async function getDBValue<T>(dbName: string, path: string[], defaultValue: T): Promise<T> {
  try {
    return await getValue(await getDataPath(dbName), path, defaultValue)
  } catch (error) {
    log.error(`Failed to get value for ${dbName} at ${path.join('.')}`, error)
    throw error
  }
}

/**
 * Get the metadata of the games
 * @returns A promise that resolves with the metadata of the games.
 */
export async function getGamesMetadata(): Promise<any> {
  try {
    return await getMetadata()
  } catch (error) {
    log.error('Failed to get metadata for games', error)
  }
}

/**
 * Get the timer data of the games
 * @returns A promise that resolves with the timer data of the games.
 */
export async function getGamesTimerdata(): Promise<any> {
  try {
    return await getTimerdata()
  } catch (error) {
    log.error('Failed to get timer data for games', error)
  }
}

/**
 * Backup the game save
 * @param gameId The id of the game
 * @returns A promise that resolves when the operation is complete.
 */
export async function backupGameSaveData(gameId: string): Promise<void> {
  try {
    await backupGameSave(gameId)
    log.info(`Backup save for game ${gameId}`)
  } catch (error) {
    log.error(`Failed to backup save for game ${gameId}`, error)
    throw error
  }
}

/**
 * Restore the game save
 * @param gameId The id of the game
 * @param saveId The id of the save
 * @returns A promise that resolves when the operation is complete.
 */
export async function restoreGameSaveData(gameId: string, saveId: string): Promise<void> {
  try {
    await restoreGameSave(gameId, saveId)
    log.info(`Restore save ${saveId} for game ${gameId}`)
  } catch (error) {
    log.error(`Failed to restore save ${saveId} for game ${gameId}`, error)
    throw error
  }
}

/**
 * Delete the game save
 * @param gameId The id of the game
 * @param saveId The id of the save
 * @returns A promise that resolves when the operation is complete.
 */
export async function deleteGameSaveData(gameId: string, saveId: string): Promise<void> {
  try {
    await deleteGameSave(gameId, saveId)
    log.info(`Delete save ${saveId} for game ${gameId}`)
  } catch (error) {
    log.error(`Failed to delete save ${saveId} for game ${gameId}`, error)
    throw error
  }
}

/**
 * Delete the game from the database
 * @param gameId The id of the game
 * @returns A promise that resolves when the operation is complete.
 */
export async function deleteGameFromDB(gameId: string): Promise<void> {
  try {
    await deleteGame(gameId)
    log.info(`Delete game ${gameId}`)
  } catch (error) {
    log.error(`Failed to delete game ${gameId}`, error)
    throw error
  }
}
