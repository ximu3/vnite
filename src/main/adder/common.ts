import { setDBValue } from '~/database'
import { getGameMetadata, getGameCover, getGameIcon, getGameScreenshots } from '~/scraper'
import { setMedia } from '~/media'
import { generateUUID, selectPathDialog, getFirstLevelSubfolders, getDataPath } from '~/utils'
import { BrowserWindow } from 'electron'
import { launcherPreset } from '~/launcher'
import { setupWatcher, stopWatcher } from '~/watcher'

export async function addGameToDB(
  dataSource: string,
  id: string,
  dbId: string,
  screenshotUrl?: string
): Promise<void> {
  const metadata = await getGameMetadata(dataSource, id)
  const coverUrl = await getGameCover(dataSource, id)
  const iconUrl = await getGameIcon(dataSource, id)
  if (dbId === '') {
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

  await setDBValue(`games/${dbId}/metadata.json`, ['#all'], {
    id: dbId,
    ...metadata
  })

  await setDBValue(`games/${dbId}/record.json`, ['addDate'], new Date().toISOString())

  const mainWindow = BrowserWindow.getAllWindows()[0]

  stopWatcher()

  await setupWatcher(mainWindow)

  mainWindow.webContents.send('reload-db-values', `games/${dbId}/cover.webp`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/background.webp`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/icon.png`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/metadata.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/record.json`)
  mainWindow.webContents.send('rebuild-index')
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

  const mainWindow = BrowserWindow.getAllWindows()[0]

  stopWatcher()

  await setupWatcher(mainWindow)

  mainWindow.webContents.send('reload-db-values', `games/${dbId}/metadata.json`)
  mainWindow.webContents.send('reload-db-values', `games/${dbId}/record.json`)
  mainWindow.webContents.send('rebuild-index')
}

export async function getBatchGameAdderData(): Promise<
  { name: string; id: string; status: string }[]
> {
  const dirPath = await selectPathDialog(['openDirectory'])
  if (!dirPath) {
    return []
  }
  const gameNames = await getFirstLevelSubfolders(dirPath)
  const data = gameNames.map((gameName) => {
    return {
      dataId: generateUUID(),
      dataSource: 'steam',
      name: gameName,
      id: '',
      status: '未添加'
    }
  })
  return data
}
