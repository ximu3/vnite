import { GameDBManager, ConfigDBManager } from '~/database'
import {
  getGameMetadata,
  getGameCovers,
  getGameIcons,
  getGameBackgrounds,
  getGameLogos
} from '~/scraper'
import { selectPathDialog, getFirstLevelSubfolders } from '~/utils'
import { generateUUID } from '@appUtils'
import { launcherPreset } from '~/launcher'
import { saveGameIconByFile } from '~/media'
import { DEFAULT_GAME_VALUES, DEFAULT_GAME_LOCAL_VALUES } from '@appTypes/database'

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
  dataSourceId,
  backgroundUrl,
  playTime
}: {
  dataSource: string
  dataSourceId: string
  backgroundUrl?: string
  playTime?: number
}): Promise<void> {
  const metadata = await getGameMetadata(dataSource, { type: 'id', value: dataSourceId })

  const dbId = generateUUID()

  const gameDoc = DEFAULT_GAME_VALUES

  gameDoc._id = dbId
  gameDoc.metadata = {
    ...gameDoc.metadata,
    ...metadata,
    originalName: metadata.originalName ?? '',
    [`${dataSource}Id`]: dataSourceId
  }

  if (playTime) {
    gameDoc.record.playTime = playTime
  }

  gameDoc.record.addDate = new Date().toISOString()

  await GameDBManager.setGame(dbId, gameDoc)

  const gameLocalDoc = DEFAULT_GAME_LOCAL_VALUES
  gameLocalDoc._id = dbId
  GameDBManager.setGameLocal(dbId, gameLocalDoc)

  const coverUrl = (
    await getGameCovers(dataSource, {
      type: 'id',
      value: dataSourceId
    })
  )[0]
  let iconUrl = ''
  let logoUrl = ''
  if (dataSource == 'steam') {
    iconUrl = (
      await getGameIcons('steamGridDb', {
        type: 'id',
        value: dataSourceId
      })
    )[0]
    logoUrl = (
      await getGameLogos('steamGridDb', {
        type: 'id',
        value: dataSourceId
      })
    )[0]
  } else {
    iconUrl = (
      await getGameIcons('steamGridDb', {
        type: 'name',
        value: metadata.originalName || metadata.name
      })
    )[0]
    logoUrl = (
      await getGameLogos('steamGridDb', {
        type: 'name',
        value: metadata.originalName || metadata.name
      })
    )[0]
  }

  if (coverUrl) {
    await GameDBManager.setGameImage(dbId, 'cover', coverUrl)
  }

  if (backgroundUrl) {
    await GameDBManager.setGameImage(dbId, 'background', backgroundUrl)
  } else {
    const backgrounds = await getGameBackgrounds(dataSource, {
      type: 'id',
      value: dataSourceId
    })
    if (backgrounds.length > 0) {
      await GameDBManager.setGameImage(dbId, 'background', backgrounds[0])
    }
  }

  if (iconUrl) {
    await GameDBManager.setGameImage(dbId, 'icon', iconUrl.toString())
  }

  if (logoUrl) {
    await GameDBManager.setGameImage(dbId, 'logo', logoUrl.toString())
  }
}

export async function updateGame({
  dbId,
  dataSource,
  dataSourceId,
  backgroundUrl
}: {
  dbId: string
  dataSource: string
  dataSourceId: string
  backgroundUrl?: string
}): Promise<void> {
  const metadata = await getGameMetadata(dataSource, { type: 'id', value: dataSourceId })
  const gameDoc = await GameDBManager.getGame(dbId)
  gameDoc.metadata = {
    ...gameDoc.metadata,
    ...metadata,
    originalName: metadata.originalName ?? '',
    [`${dataSource}Id`]: dataSourceId
  }
  await GameDBManager.setGame(dbId, gameDoc)

  if (backgroundUrl) {
    await GameDBManager.setGameImage(dbId, 'background', backgroundUrl)
  }

  const coverUrl = (await getGameCovers(dataSource, { type: 'id', value: dataSourceId }))[0]
  if (coverUrl) {
    await GameDBManager.setGameImage(dbId, 'cover', coverUrl)
  }
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

  const gameLocalDoc = DEFAULT_GAME_LOCAL_VALUES
  gameLocalDoc._id = dbId
  gameLocalDoc.path.gamePath = gamePath
  GameDBManager.setGameLocal(dbId, gameLocalDoc)

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
      status: 'idle'
    }
  })
  return data
}
