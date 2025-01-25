import { getDBValue, setDBValue, checkPathJsonVersion } from './services'
import path from 'path'
import { getDataPath, generateUUID } from '~/utils'
import fse from 'fs-extra'

export async function upgradePathJson1to2(gameId: string): Promise<void> {
  const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '', true)
  const savePathMode = await getDBValue(
    `games/${gameId}/path.json`,
    ['savePath', 'mode'],
    'folder',
    true
  )
  const savePathOld = await getDBValue<string[]>(
    `games/${gameId}/path.json`,
    ['savePath', savePathMode],
    [],
    true
  )

  const newPathJson: {
    version: number
    gamePath: string
    savePathInGame: string[]
    savePathInDB: string[]
  } = {
    version: 2,
    gamePath: gamePath,
    savePathInGame: savePathOld,
    savePathInDB: []
  }

  const backupPathRoot = await getDataPath(`games/${gameId}/saves/`)
  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})
  const saveIds = Object.keys(saveList)
  for (let i = 0; i < savePathOld.length; i++) {
    newPathJson.savePathInDB.push(`${i + 1}_${path.basename(savePathOld[i])}`)

    // Rename the old saves with new version prefix.
    for (let j = 0; j < saveIds.length; j++) {
      const backupPath = path.join(backupPathRoot, saveIds[j])
      await fse.move(
        path.join(backupPath, path.basename(savePathOld[i])),
        path.join(backupPath, `${i + 1}_${path.basename(savePathOld[i])}`)
      )
    }
  }

  await setDBValue(`games/${gameId}/path.json`, ['#all'], newPathJson)
}

export async function backupGameSave(gameId: string): Promise<void> {
  const saveId = generateUUID()

  await checkPathJsonVersion(gameId)

  const savePathInGame = await getDBValue<string[]>(
    `games/${gameId}/path.json`,
    ['savePathInGame'],
    []
  )
  const savePathInDB = await getDBValue<string[]>(`games/${gameId}/path.json`, ['savePathInDB'], [])
  if (savePathInDB.length !== savePathInGame.length) {
    // TODO: Throw error
  }

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

  // If pathInDB is empty, assign basename and prepend a unique counter prefix
  if (savePathInDB[0] === '') {
    for (let i = 0; i < savePathInGame.length; i++) {
      const pathInGame = savePathInGame[i]

      const targetPath = `${i + 1}_${path.basename(pathInGame)}`

      savePathInDB[i] = targetPath
    }
    await setDBValue(`games/${gameId}/path.json`, ['savePathInGame'], savePathInGame)
    await setDBValue(`games/${gameId}/path.json`, ['savePathInDB'], savePathInDB)
  }

  savePathInGame.forEach(async (pathInGame, index) => {
    const pathInDB = savePathInDB[index]
    if (pathInDB) {
      await fse.copy(pathInGame, path.join(backupPath, pathInDB))
    }
  })

  // Add a new archive to the list
  saveList[saveId] = { id: saveId, date: new Date().toISOString(), note: '' }
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  await checkPathJsonVersion(gameId)

  const backupPath = await getDataPath(`games/${gameId}/saves/${saveId}/`)
  const savePathInGame = await getDBValue<string[]>(
    `games/${gameId}/path.json`,
    ['savePathInGame'],
    []
  )
  const savePathInDB = await getDBValue<string[]>(`games/${gameId}/path.json`, ['savePathInDB'], [])
  if (savePathInDB.length !== savePathInGame.length) {
    // TODO: Throw error
  }

  savePathInGame.forEach(async (pathInGame, index) => {
    const pathInDB = savePathInDB[index]
    if (pathInDB) {
      await fse.copy(path.join(backupPath, pathInDB), pathInGame)
    }
  })
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  const saveList = await getDBValue(`games/${gameId}/save.json`, ['#all'], {})
  delete saveList[saveId]
  await setDBValue(`games/${gameId}/save.json`, ['#all'], saveList)
  await fse.remove(await getDataPath(`games/${gameId}/saves/${saveId}/`))
}
