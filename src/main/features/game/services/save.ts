import fse from 'fs-extra'
import path from 'path'
import { zipFolder, unzipFile } from '~/utils'
import { getAppTempPath } from '~/features/system'
import { generateUUID } from '@appUtils'
import { GameDBManager } from '~/core/database'
import log from 'electron-log/main'
import { eventBus } from '~/core/events'

export async function backupGameSave(gameId: string): Promise<void> {
  try {
    const saveId = generateUUID()
    const savePaths = await GameDBManager.getGameLocalValue(gameId, 'path.savePaths')
    const maxSaveNumber = await GameDBManager.getGameValue(gameId, 'save.maxBackups')
    const tempFilesPath = getAppTempPath(`save-files-${Date.now()}/`)
    const tempZipPath = getAppTempPath(`save-zip-${Date.now()}/`)
    await fse.ensureDir(tempFilesPath)
    await fse.ensureDir(tempZipPath)

    const saveList = await GameDBManager.getGameValue(gameId, 'save.saveList')

    const saveIds = Object.keys(saveList).filter((key) => !saveList[key].locked)

    // If the number of saves exceeds the maximum, delete the oldest ones
    if (saveIds.length >= maxSaveNumber) {
      saveIds.sort(
        (a, b) => new Date(saveList[a].date).getTime() - new Date(saveList[b].date).getTime()
      )

      const deleteCount = saveIds.length - Number(maxSaveNumber) + 1
      const oldestSaveIds = saveIds.slice(0, deleteCount)

      for (const saveId of oldestSaveIds) {
        delete saveList[saveId]
        await GameDBManager.removeGameSave(gameId, saveId)
      }
    }

    await Promise.all(
      savePaths.map(async (pathInGame) => {
        const backupName = path.basename(pathInGame)
        try {
          // Copy the file to the temporary backup directory
          await fse.copy(pathInGame, path.join(tempFilesPath, backupName))
        } catch (error) {
          log.error(`[Game] Failed to backup ${pathInGame}:`, error)
        }
      })
    )

    // Create a zip file from the temporary backup directory
    const zipPath = await zipFolder(tempFilesPath, tempZipPath, saveId)
    await GameDBManager.setGameSave(gameId, saveId, zipPath)

    saveList[saveId] = { _id: saveId, date: new Date().toISOString(), note: '', locked: false }
    await GameDBManager.setGameValue(gameId, 'save.saveList', saveList)

    await fse.remove(tempFilesPath)
    await fse.remove(tempZipPath)

    // Emit event after saving the game
    eventBus.emit(
      'game:save-created',
      {
        gameId,
        saveId
      },
      { source: 'game-save' }
    )
  } catch (error) {
    log.error('[Game] Error backing up game save:', error)
    throw error
  }
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  try {
    const savePaths = await GameDBManager.getGameLocalValue(gameId, 'path.savePaths')
    const tempFilesPath = getAppTempPath(`save-files-${Date.now()}/`)
    const tempZipPath = await GameDBManager.getGameSave(gameId, saveId, 'file')
    await fse.ensureDir(tempFilesPath)

    await unzipFile(tempZipPath, tempFilesPath)

    await Promise.all(
      savePaths.map(async (pathInGame) => {
        const backupName = path.basename(pathInGame)
        try {
          // Copy the file from the temporary backup directory to the game save path
          await fse.copy(path.join(tempFilesPath, backupName), pathInGame)
        } catch (error) {
          log.error(`[Game] [Game] Failed to restore ${pathInGame}:`, error)
        }
      })
    )

    // Emit event after restoring the game
    eventBus.emit(
      'game:save-restored',
      {
        gameId,
        saveId
      },
      { source: 'game-save' }
    )
  } catch (error) {
    log.error('[Game] Error restoring game save:', error)
    throw error
  }
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  try {
    const saveList = await GameDBManager.getGameValue(gameId, 'save.saveList')
    delete saveList[saveId]
    await GameDBManager.setGameValue(gameId, 'save.saveList', saveList)
    await GameDBManager.removeGameSave(gameId, saveId)

    // Emit event after deleting the save
    eventBus.emit(
      'game:save-deleted',
      {
        gameId,
        saveId
      },
      { source: 'game-save' }
    )
  } catch (error) {
    log.error('[Game] Error deleting save:', error)
    throw error
  }
}
