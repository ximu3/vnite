import { setDBValue, getDBValue } from '~/database'
import { getGameMetadata, getGameCover, getGameIcon, getGameScreenshots } from '~/scraper'
import { setMedia, saveIcon } from '~/media'
import { generateUUID, selectPathDialog, getFirstLevelSubfolders, getDataPath } from '~/utils'
import { BrowserWindow } from 'electron'
import { launcherPreset } from '~/launcher'
import { setupWatcher, stopWatcher } from '~/watcher'
import { rebuildIndex } from '~/database/gameIndex'
import { rebuildRecords } from '~/database/record'

export async function addGameToDB({
  dataSource,
  id,
  dbId,
  screenshotUrl,
  playingTime
}: {
  dataSource: string
  id: string
  dbId?: string
  screenshotUrl?: string
  playingTime?: number
}): Promise<void> {
  const metadata = await getGameMetadata(dataSource, id)
  const coverUrl = await getGameCover(dataSource, id)
  const iconUrl = await getGameIcon(dataSource, id)
  if (!dbId) {
    dbId = generateUUID()
  }

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

  await setDBValue(`games/${dbId}/record.json`, ['addDate'], new Date().toISOString())

  await setDBValue(`games/${dbId}/launcher.json`, ['#all'], {})
  await setDBValue(`games/${dbId}/path.json`, ['#all'], {})
  await setDBValue(`games/${dbId}/save.json`, ['#all'], {})

  const mainWindow = BrowserWindow.getAllWindows()[0]

  stopWatcher()

  await setupWatcher(mainWindow)

  mainWindow.webContents.send('reload-db-values', `games/${dbId}/cover.webp`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/background.webp`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/icon.png`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/metadata.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/record.json`)
  await rebuildIndex()
  await rebuildRecords()
}

export async function addGameToDBWithoutMetadata(gamePath: string): Promise<void> {
  const dbId = generateUUID()
  await getDataPath(`games/${dbId}/`, true)
  await setDBValue(`games/${dbId}/record.json`, ['addDate'], new Date().toISOString())
  await setDBValue(`games/${dbId}/path.json`, ['gamePath'], gamePath)
  const gameName = gamePath.split('\\').pop()?.split('.')?.slice(0, -1).join('.')
  await setDBValue(`games/${dbId}/metadata.json`, ['#all'], {
    id: dbId,
    name: gameName
  })
  await launcherPreset('default', dbId)
  await saveIcon(dbId, gamePath)

  const mainWindow = BrowserWindow.getAllWindows()[0]

  stopWatcher()

  await setupWatcher(mainWindow)

  mainWindow.webContents.send('reload-db-values', `games/${dbId}/metadata.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/record.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/launcher.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/icon.png`)
  await rebuildIndex()
}

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
