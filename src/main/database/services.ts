import { setValue, getValue } from './common'
import { BrowserWindow } from 'electron'
import { getDataPath } from '~/utils'
import { getGameIndex, updateGameIndex } from './gameIndex'
import { getGameRecords, updateGameRecord } from './record'
import { backupGameSave, restoreGameSave, deleteGameSave } from './save'
import { deleteGame } from './utils'
import { backupDatabase, restoreDatabase } from './backup'
import log from 'electron-log/main.js'

/**
 * Get the value of the database
 * @param dbName The name of the database
 * @param path The path to the key.
 * @param value — The value to set.
 * @returns A promise that resolves when the operation is complete.
 */
export async function setDBValue(
  dbName: string,
  path: string[],
  value: any,
  noIpcAction?: boolean
): Promise<void> {
  try {
    await setValue(await getDataPath(dbName), path, value)
    if (dbName.startsWith('games/')) {
      if (dbName.includes('record.json')) {
        await updateGameRecord(dbName.split('/')[1])
      }
      await updateGameIndex(dbName.split('/')[1])
    }
    if (noIpcAction) {
      return
    }
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('reload-db-values', dbName)
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
export function getGameIndexData(): any {
  try {
    return getGameIndex()
  } catch (error) {
    console.error('Failed to get metadata for games', error)
  }
}

/**
 * Get the record data of the games
 * @returns A promise that resolves with the record data of the games.
 */
export function getGamesRecordData(): any {
  try {
    return getGameRecords()
  } catch (error) {
    log.error('Failed to get record data for games', error)
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

/**
 * Backup the database
 * @param targetPath The path to the target file.
 * @returns A promise that resolves when the operation is complete.
 */
export async function backupDatabaseData(targetPath: string): Promise<void> {
  try {
    await backupDatabase(targetPath)
    log.info(`Backup database to ${targetPath}`)
  } catch (error) {
    log.error(`Failed to backup database to ${targetPath}`, error)
    throw error
  }
}

/**
 * Restore the database
 * @param sourcePath The path to the source file.
 * @returns A promise that resolves when the operation is complete.
 */
export async function restoreDatabaseData(sourcePath: string): Promise<void> {
  try {
    await restoreDatabase(sourcePath)
    log.info(`Restore database from ${sourcePath}`)
  } catch (error) {
    log.error(`Failed to restore database from ${sourcePath}`, error)
    throw error
  }
}
