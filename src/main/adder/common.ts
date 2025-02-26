import { GameDBManager, ConfigDBManager } from '~/database'
import {
  getGameMetadata,
  getGameCover,
  getGameIcon,
  getGameScreenshots,
  getGameLogo
} from '~/scraper'
import { selectPathDialog, getFirstLevelSubfolders } from '~/utils'
import { generateUUID } from '@appUtils'
import { launcherPreset } from '~/launcher'
import { saveGameIconByFile } from '~/media'
import { DEFAULT_GAME_VALUES } from '@appTypes/database'

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
  playTime
}: {
  dataSource: string
  id: string
  preExistingDbId?: string
  screenshotUrl?: string
  playTime?: number
  noWatcherAction?: boolean
  noIpcAction?: boolean
}): Promise<void> {
  const metadata = await getGameMetadata(dataSource, id)
  const coverUrl = await getGameCover(dataSource, id)
  let iconUrl = ''
  let logoUrl = ''
  if (dataSource == 'steam') {
    iconUrl = await getGameIcon('steamGridDb', Number(id))
    logoUrl = await getGameLogo('steamGridDb', Number(id))
  } else {
    iconUrl = await getGameIcon('steamGridDb', metadata.originalName || metadata.name)
    logoUrl = await getGameLogo('steamGridDb', metadata.originalName || metadata.name)
  }

  const dbId = preExistingDbId || generateUUID()

  if (coverUrl) {
    await GameDBManager.setGameImage(dbId, 'cover', coverUrl)
  }

  if (screenshotUrl) {
    await GameDBManager.setGameImage(dbId, 'background', screenshotUrl)
  } else {
    const screenshots = await getGameScreenshots(dataSource, id)
    if (screenshots.length > 0) {
      await GameDBManager.setGameImage(dbId, 'background', screenshots[0])
    }
  }

  const gameDoc = DEFAULT_GAME_VALUES

  if (iconUrl) {
    await GameDBManager.setGameImage(dbId, 'icon', iconUrl.toString())
  }

  if (logoUrl) {
    await GameDBManager.setGameImage(dbId, 'logo', logoUrl.toString())
  }

  if (playTime) {
    gameDoc.record.playTime = playTime
  }

  gameDoc._id = dbId
  gameDoc.metadata = {
    ...gameDoc.metadata,
    ...metadata,
    originalName: metadata.originalName ?? '',
    [`${dataSource}Id`]: id
  }

  if (!preExistingDbId) {
    gameDoc.record.addDate = new Date().toISOString()
  }

  await GameDBManager.setGame(dbId, gameDoc)
}

/**
 * Add a game to the database without metadata
 * @param gamePath - The path of the game
 * @returns void
 */
export async function addGameToDBWithoutMetadata(gamePath: string): Promise<void> {
  const dbId = generateUUID()
  const gameDoc = DEFAULT_GAME_VALUES
  gameDoc._id = dbId
  gameDoc.record.addDate = new Date().toISOString()
  GameDBManager.setGame(dbId, gameDoc)

  await launcherPreset('default', dbId)
  await saveGameIconByFile(dbId, gamePath)
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
  const defaultDataSource = await ConfigDBManager.getConfigValue('game.scraper.defaultDatasSource')
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
