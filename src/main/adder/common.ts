import { setDBValue, getDBValue } from '~/database'
import { getGameMetadata, getGameCover, getGameIcon, getGameScreenshots } from '~/scraper'
import { setMedia, saveIcon } from '~/media'
import { generateUUID, selectPathDialog, getFirstLevelSubfolders, getDataPath } from '~/utils'
import { BrowserWindow } from 'electron'
import { launcherPreset } from '~/launcher'
import { updateGameIndex } from '~/database/gameIndex'
import { updateGameRecord } from '~/database/record'

/**
 * Add a game to the database
 * @param dataSource - The data source of the game
 * @param id - The ID of the game
 * @param dbId - The ID of the game in the database
 * @param screenshotUrl - The URL of the screenshot of the game
 * @param playingTime - The playing time of the game
 * @returns void
 */
export async function addGameToDB({
  dataSource,
  id,
  preExistingDbId,
  screenshotUrl,
  playingTime,
  noIpcAction = false
}: {
  dataSource: string
  id: string
  preExistingDbId?: string
  screenshotUrl?: string
  playingTime?: number
  noWatcherAction?: boolean
  noIpcAction?: boolean
}): Promise<void> {
  const metadata = await getGameMetadata(dataSource, id)
  const coverUrl = await getGameCover(dataSource, id)
  const iconUrl = await getGameIcon(dataSource, id)
  const dbId = preExistingDbId || generateUUID()

  await getDataPath(`games/${dbId}/`, true)

  if (coverUrl) {
    await setMedia(dbId, 'cover', coverUrl)
  }

  if (screenshotUrl) {
    await setMedia(dbId, 'background', screenshotUrl)
  } else {
    const screenshots = await getGameScreenshots(dataSource, id)
    if (screenshots.length > 0) {
      await setMedia(dbId, 'background', screenshots[0])
    }
  }

  if (iconUrl) {
    await setMedia(dbId, 'icon', iconUrl)
  }

  if (playingTime) {
    await setDBValue(`games/${dbId}/record.json`, ['playingTime'], playingTime)
  }

  await setDBValue(`games/${dbId}/metadata.json`, ['#all'], {
    id: dbId,
    [`${dataSource}Id`]: id,
    ...metadata
  })

  if (!preExistingDbId) {
    await setDBValue(`games/${dbId}/record.json`, ['#all'], {
      addDate: new Date().toISOString(),
      lastRunDate: '',
      score: -1,
      playingTime: 0,
      playStatus: 'unplayed'
    })
    await setDBValue(`games/${dbId}/launcher.json`, ['#all'], {
      mode: 'file',
      fileConfig: {
        path: '',
        workingDirectory: '',
        timerMode: 'folder',
        timerPath: ''
      },
      scriptConfig: {
        command: [],
        workingDirectory: '',
        timerMode: 'folder',
        timerPath: ''
      },
      urlConfig: {
        url: '',
        timerMode: 'folder',
        timerPath: '',
        browserPath: ''
      }
    })
    await setDBValue(`games/${dbId}/path.json`, ['#all'], {
      version: 2,
      gamePath: '',
      savePathInGame: [
        /** string */
      ],
      savePathInDB: [
        /** string */
      ]
    })
    await setDBValue(`games/${dbId}/save.json`, ['#all'], {})
  }

  const mainWindow = BrowserWindow.getAllWindows()[0]

  if (!noIpcAction) {
    mainWindow.webContents.send('reload-db-values', `games/${dbId}/cover.webp`)
    mainWindow.webContents.send('reload-db-values', `games/${dbId}/background.webp`)
    mainWindow.webContents.send('reload-db-values', `games/${dbId}/icon.png`)
    mainWindow.webContents.send('reload-db-values', `games/${dbId}/metadata.json`)
    mainWindow.webContents.send('reload-db-values', `games/${dbId}/record.json`)
    await updateGameIndex(dbId)
    await updateGameRecord(dbId)
  }
}

/**
 * Add a game to the database without metadata
 * @param gamePath - The path of the game
 * @returns void
 */
export async function addGameToDBWithoutMetadata(gamePath: string): Promise<void> {
  const dbId = generateUUID()
  await getDataPath(`games/${dbId}/`, true)
  await setDBValue(`games/${dbId}/record.json`, ['#all'], {
    addDate: new Date().toISOString(),
    lastRunDate: '',
    score: -1,
    playingTime: 0,
    playStatus: 'unplayed'
  })
  await setDBValue(`games/${dbId}/launcher.json`, ['#all'], {
    mode: 'file',
    fileConfig: {
      path: '',
      workingDirectory: '',
      timerMode: 'folder',
      timerPath: ''
    },
    scriptConfig: {
      command: [],
      workingDirectory: '',
      timerMode: 'folder',
      timerPath: ''
    },
    urlConfig: {
      url: '',
      timerMode: 'folder',
      timerPath: '',
      browserPath: ''
    }
  })
  await setDBValue(`games/${dbId}/path.json`, ['#all'], {
    version: 2,
    gamePath: '',
    savePathInGame: [
      /** string */
    ],
    savePathInDB: [
      /** string */
    ]
  })
  const gameName = gamePath.split('\\').pop()?.split('.')?.slice(0, -1).join('.')
  await setDBValue(`games/${dbId}/metadata.json`, ['#all'], {
    id: dbId,
    name: gameName
  })
  await launcherPreset('default', dbId)
  await saveIcon(dbId, gamePath)

  const mainWindow = BrowserWindow.getAllWindows()[0]

  mainWindow.webContents.send('reload-db-values', `games/${dbId}/metadata.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/record.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/launcher.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/icon.png`)
  await updateGameIndex(dbId)
}

/**
 * Get the data for batch game adding
 * @returns The data for batch game adding
 */
export async function getBatchGameAdderData(): Promise<
  { name: string; id: string; status: string }[]
> {
  const dirPath = await selectPathDialog(['openDirectory'])
  if (!dirPath) {
    return []
  }
  const defaultDataSource = await getDBValue(
    'config.json',
    ['scraper', 'defaultDataSource'],
    'steam'
  )
  const gameNames = await getFirstLevelSubfolders(dirPath)
  const data = gameNames.map((gameName) => {
    return {
      dataId: generateUUID(),
      dataSource: defaultDataSource,
      name: gameName,
      id: '',
      status: '未添加'
    }
  })
  return data
}
