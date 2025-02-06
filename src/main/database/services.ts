import { setValue, getValue } from './common'
import { BrowserWindow } from 'electron'
import { getDataPath } from '~/utils'
import { getGameIndex, updateGameIndex } from './gameIndex'
import { getGameRecords, updateGameRecord } from './record'
import { backupGameSave, restoreGameSave, deleteGameSave } from './save'
import { deleteGame } from './utils'
import { backupDatabase, restoreDatabase } from './backup'
import { addMemory, deleteMemory, updateMemoryCover, getMemoryCoverPath } from './memory'
import log from 'electron-log/main.js'

/**
 * Set the value of the database
 * @param dbName The name of the database
 * @param path The path to the key.
 * @param value — The value to set.
 * @param noIpcAction — Whether to skip the IPC action.
 * @param noGameAction — Whether to skip the game action and IPC action.
 * @returns A promise that resolves when the operation is complete.
 */
export async function setDBValue(
  dbName: string,
  path: string[],
  value: any,
  noIpcAction?: boolean,
  noGameAction?: boolean
): Promise<void> {
  try {
    await setValue(await getDataPath(dbName), path, value)
    if (noGameAction) {
      return
    }
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
 * @param withoutCheck Check the json version and upgrade it.(now only used for path.json)
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
export async function backupDatabaseData(targetPath: string, exclude?: string[]): Promise<void> {
  try {
    await backupDatabase(targetPath, exclude)
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

/**
 * Add a memory
 * @param gameId The id of the game
 * @param note The note of the memory
 * @param imgPath The path to the image
 * @returns A promise that resolves when the operation is complete.
 */
export async function addMemoryData(gameId: string): Promise<void> {
  try {
    await addMemory(gameId)
    log.info(`Add memory for game ${gameId}`)
  } catch (error) {
    log.error(`Failed to add memory for game ${gameId}`, error)
    throw error
  }
}

/**
 * Delete a memory
 * @param gameId The id of the game
 * @param memoryId The id of the memory
 * @returns A promise that resolves when the operation is complete.
 */
export async function deleteMemoryData(gameId: string, memoryId: string): Promise<void> {
  try {
    await deleteMemory(gameId, memoryId)
    log.info(`Delete memory ${memoryId} for game ${gameId}`)
  } catch (error) {
    log.error(`Failed to delete memory ${memoryId} for game ${gameId}`, error)
    throw error
  }
}

/**
 * Update the cover of a memory
 * @param gameId The id of the game
 * @param memoryId The id of the memory
 * @param imgPath The path to the image
 * @returns A promise that resolves when the operation is complete.
 */
export async function updateMemoryCoverData(
  gameId: string,
  memoryId: string,
  imgPath: string
): Promise<void> {
  try {
    await updateMemoryCover(gameId, memoryId, imgPath)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('reload-db-values', `games/${gameId}/memories/${memoryId}/cover`)
    log.info(`Update cover for memory ${memoryId} of game ${gameId}`)
  } catch (error) {
    log.error(`Failed to update cover for memory ${memoryId} of game ${gameId}`, error)
    throw error
  }
}

/**
 * Get the path to the cover of a memory
 * @param gameId The id of the game
 * @param memoryId The id of the memory
 * @returns A promise that resolves with the path to the cover.
 */
export async function getMemoryCoverPathData(gameId: string, memoryId: string): Promise<string> {
  try {
    return await getMemoryCoverPath(gameId, memoryId)
  } catch (error) {
    log.error(`Failed to get cover path for memory ${memoryId} of game ${gameId}`, error)
    throw error
  }
}
