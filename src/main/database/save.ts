import { getDBValue, setDBValue } from './services'
import path from 'path'
import { getDataPath, generateUUID } from '~/utils'
import fse from 'fs-extra'

export async function backupGameSave(gameId: string): Promise<void> {
  const saveId = generateUUID()

  const savePathMode = await getDBValue(`games/${gameId}/path.json`, ['savePath', 'mode'], 'folder')
  const savePath = await getDBValue(`games/${gameId}/path.json`, ['savePath', savePathMode], [''])
  const backupPath = await getDataPath(`games/${gameId}/saves/${saveId}/`)

  // Get a list of the current archives
  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})

  // If the number of archives exceeds 7, delete the oldest archives
  const saveIds = Object.keys(saveList)
  if (saveIds.length >= 7) {
    // 按日期排序，删除最旧的存档
    saveIds.sort(
      (a, b) => new Date(saveList[a].date).getTime() - new Date(saveList[b].date).getTime()
    )
    const oldestSaveId = saveIds[0]
    delete saveList[oldestSaveId]
    await fse.remove(await getDataPath(`games/${gameId}/saves/${oldestSaveId}/`))
  }

  // Backup new archive
  savePath.forEach(async (filePath) => {
    const fileName = path.basename(filePath)
    await fse.copy(filePath, path.join(backupPath, fileName))
  })

  // Add a new archive to the list
  saveList[saveId] = { id: saveId, date: new Date().toISOString(), note: '' }
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  const savePathMode = await getDBValue(`games/${gameId}/path.json`, ['savePath', 'mode'], 'folder')
  const savePath = await getDBValue(`games/${gameId}/path.json`, ['savePath', savePathMode], [''])
  const backupPath = await getDataPath(`games/${gameId}/saves/${saveId}/`)
  savePath.forEach(async (filePath) => {
    const fileName = path.basename(filePath)
    await fse.copy(path.join(backupPath, fileName), filePath)
  })
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})
  delete saveList[saveId]
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
  await fse.remove(await getDataPath(`games/${gameId}/saves/${saveId}/`))
}
