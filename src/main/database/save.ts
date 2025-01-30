import { getDBValue, setDBValue } from './services'
import path from 'path'
import { getDataPath, generateUUID } from '~/utils'
import fse from 'fs-extra'

export async function backupGameSave(gameId: string): Promise<void> {
  const saveId = generateUUID()
  const savePaths = await getDBValue<string[]>(`games/${gameId}/path.json`, ['savePath'], [])
  const backupPath = await getDataPath(`games/${gameId}/saves/${saveId}/`)

  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})
  const saveIds = Object.keys(saveList)

  if (saveIds.length >= 7) {
    saveIds.sort(
      (a, b) => new Date(saveList[a].date).getTime() - new Date(saveList[b].date).getTime()
    )
    const oldestSaveId = saveIds[0]
    delete saveList[oldestSaveId]
    await fse.remove(await getDataPath(`games/${gameId}/saves/${oldestSaveId}/`))
  }

  await Promise.all(
    savePaths.map(async (pathInGame) => {
      const backupName = path.basename(pathInGame)
      try {
        await fse.copy(pathInGame, path.join(backupPath, backupName))
      } catch (error) {
        console.error(`Failed to backup ${pathInGame}:`, error)
      }
    })
  )

  saveList[saveId] = { id: saveId, date: new Date().toISOString(), note: '' }
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  const backupPath = await getDataPath(`games/${gameId}/saves/${saveId}/`)
  const savePaths = await getDBValue<string[]>(`games/${gameId}/path.json`, ['savePath'], [])

  await Promise.all(
    savePaths.map(async (pathInGame) => {
      const backupName = path.basename(pathInGame)
      try {
        await fse.copy(path.join(backupPath, backupName), pathInGame)
      } catch (error) {
        console.error(`Failed to restore ${pathInGame}:`, error)
        // 可以选择抛出错误或进行其他错误处理
      }
    })
  )
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})
  delete saveList[saveId]
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
  await fse.remove(await getDataPath(`games/${gameId}/saves/${saveId}/`))
}
