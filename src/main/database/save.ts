import { getDBValue, setDBValue, checkPathJsonVersion } from './services'
import path from 'path'
import { getDataPath, generateUUID } from '~/utils'
import fse from 'fs-extra'

export async function upgradePathJson1to2(gameId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')
  const savePathMode = await getDBValue(`games/${gameId}/path.json`, ['savePath', 'mode'], 'folder')
  const savePath = await getDBValue(`games/${gameId}/path.json`, ['savePath', savePathMode], [''])

  const newPathJson: {
    version: number
    gamePath: string
    savePath: { pathInGame: string; pathInDB: string }[]
  } = {
    version: 2,
    gamePath: gamePath,
    savePath: []
  }

  savePath.forEach((filePath: string) => {
    newPathJson.savePath.push({
      pathInGame: filePath,
      pathInDB: path.basename(filePath)
    })
  })

  await setDBValue(`games/${gameId}/path.json`, ['#all'], newPathJson)
}

export async function backupGameSave(gameId: string): Promise<void> {
  const saveId = generateUUID()

  await checkPathJsonVersion(gameId)
  const savePath = await getDBValue<{ pathInGame: string; pathInDB: string }[]>(
    `games/${gameId}/path.json`,
    ['savePath'],
    []
  )

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
  savePath.forEach(async ({ pathInGame, pathInDB }) => {
    await fse.copy(pathInGame, path.join(backupPath, pathInDB))
  })

  // Add a new archive to the list
  saveList[saveId] = { id: saveId, date: new Date().toISOString(), note: '' }
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  await checkPathJsonVersion(gameId)
  const savePath = await getDBValue<{ pathInGame: string; pathInDB: string }[]>(
    `games/${gameId}/path.json`,
    ['savePath'],
    []
  )

  const backupPath = await getDataPath(`games/${gameId}/saves/${saveId}/`)
  savePath.forEach(async ({ pathInGame, pathInDB }) => {
    await fse.copy(path.join(backupPath, pathInDB), pathInGame)
  })
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})
  delete saveList[saveId]
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
  await fse.remove(await getDataPath(`games/${gameId}/saves/${saveId}/`))
}
