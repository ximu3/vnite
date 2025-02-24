import fse from 'fs-extra'
import path from 'path'
import { generateUUID, zipFolder, unzipFile, getAppTempPath } from '~/utils'
import { GameDBManager } from './game'

export async function backupGameSave(gameId: string): Promise<void> {
  const saveId = generateUUID()
  const savePaths = await GameDBManager.getGameValue(gameId, 'path.savePaths')
  const maxSaveNumber = await GameDBManager.getGameValue(gameId, 'path.maxSaveBackups')
  const tempFilesPath = getAppTempPath(`save-files-${Date.now()}/`)
  const tempZipPath = getAppTempPath(`save-zip-${Date.now()}/`)
  await fse.ensureDir(tempFilesPath)
  await fse.ensureDir(tempZipPath)

  const saveList = await GameDBManager.getGameValue(gameId, 'save')

  const saveIds = Object.keys(saveList).filter((key) => !saveList[key].locked)

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
        await fse.copy(pathInGame, path.join(tempFilesPath, backupName))
      } catch (error) {
        console.error(`Failed to backup ${pathInGame}:`, error)
      }
    })
  )

  const zipPath = await zipFolder(tempFilesPath, tempZipPath, saveId)
  await GameDBManager.setGameSave(gameId, saveId, zipPath)

  saveList[saveId] = { _id: saveId, date: new Date().toISOString(), note: '', locked: false }
  await GameDBManager.setGameValue(gameId, 'save', saveList)

  await fse.remove(tempFilesPath)
  await fse.remove(tempZipPath)
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  const savePaths = await GameDBManager.getGameValue(gameId, 'path.savePaths')
  const tempFilesPath = getAppTempPath(`save-files-${Date.now()}/`)
  const tempZipPath = await GameDBManager.getGameSave(gameId, saveId, 'file')
  await fse.ensureDir(tempFilesPath)

  await unzipFile(tempZipPath, tempFilesPath)

  await Promise.all(
    savePaths.map(async (pathInGame) => {
      const backupName = path.basename(pathInGame)
      try {
        await fse.copy(path.join(tempFilesPath, backupName), pathInGame)
      } catch (error) {
        console.error(`Failed to restore ${pathInGame}:`, error)
        // 可以选择抛出错误或进行其他错误处理
      }
    })
  )
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  const saveList = await GameDBManager.getGameValue(gameId, 'save')
  delete saveList[saveId]
  await GameDBManager.setGameValue(gameId, 'save', saveList)
  await GameDBManager.removeGameSave(gameId, saveId)
}
