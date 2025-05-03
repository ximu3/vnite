import { GameDBManager, ConfigDBManager } from '~/database'
import {
  getGameMetadata,
  getGameCovers,
  getGameIcons,
  getGameBackgrounds,
  getGameLogos
} from '~/scraper'
import { selectPathDialog, getSubfoldersByDepth } from '~/utils'
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
  playTime,
  dirPath
}: {
  dataSource: string
  dataSourceId: string
  backgroundUrl?: string
  playTime?: number
  dirPath?: string
}): Promise<void> {
  // First get metadata (other operations depend on this result)
  const metadata = await getGameMetadata(dataSource, { type: 'id', value: dataSourceId })
  const dbId = generateUUID()

  // Prepare game document
  const gameDoc = { ...DEFAULT_GAME_VALUES }
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

  const gameLocalDoc = { ...DEFAULT_GAME_LOCAL_VALUES }
  gameLocalDoc._id = dbId
  gameLocalDoc.utils.markPath = dirPath ?? ''

  // Fetch all image resources in parallel
  const [covers, backgrounds, icons, logos] = await Promise.all([
    getGameCovers(dataSource, { type: 'id', value: dataSourceId }),
    !backgroundUrl
      ? getGameBackgrounds(dataSource, { type: 'id', value: dataSourceId })
      : Promise.resolve([]),
    dataSource == 'steam'
      ? getGameIcons('steamGridDb', { type: 'id', value: dataSourceId })
      : getGameIcons('steamGridDb', {
          type: 'name',
          value: metadata.originalName || metadata.name
        }),
    dataSource == 'steam'
      ? getGameLogos('steamGridDb', { type: 'id', value: dataSourceId })
      : getGameLogos('steamGridDb', { type: 'name', value: metadata.originalName || metadata.name })
  ])

  // Prepare all database write operations
  const dbPromises: Promise<unknown>[] = [
    GameDBManager.setGame(dbId, gameDoc),
    GameDBManager.setGameLocal(dbId, gameLocalDoc)
  ]

  // Prepare all image save operations
  if (covers.length > 0) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'cover', covers[0]))
  }

  if (backgroundUrl) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'background', backgroundUrl))
  } else if (backgrounds.length > 0) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'background', backgrounds[0]))
  }

  if (icons.length > 0) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'icon', icons[0].toString()))
  }

  if (logos.length > 0) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'logo', logos[0].toString()))
  }

  // Execute all database operations in parallel
  await Promise.all(dbPromises)
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
  // Fetch metadata and game document in parallel
  const [metadata, gameDoc, coverUrls] = await Promise.all([
    getGameMetadata(dataSource, { type: 'id', value: dataSourceId }),
    GameDBManager.getGame(dbId),
    getGameCovers(dataSource, { type: 'id', value: dataSourceId })
  ])

  // Update document
  gameDoc.metadata = {
    ...gameDoc.metadata,
    ...metadata,
    originalName: metadata.originalName ?? '',
    [`${dataSource}Id`]: dataSourceId
  }

  // Prepare all database write operations
  const dbPromises: Promise<unknown>[] = [GameDBManager.setGame(dbId, gameDoc)]

  // Add image save operations
  if (backgroundUrl) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'background', backgroundUrl))
  }

  if (coverUrls.length > 0) {
    dbPromises.push(GameDBManager.setGameImage(dbId, 'cover', coverUrls[0]))
  }

  // Execute all database operations in parallel
  await Promise.all(dbPromises)
}

/**
 * Add a game to the database without metadata
 * @param gamePath - The path of the game
 * @returns void
 */
export async function addGameToDBWithoutMetadata(gamePath: string): Promise<void> {
  const dbId = generateUUID()
  const gameName = gamePath.split('\\').pop() ?? ''
  const gameDoc = { ...DEFAULT_GAME_VALUES }
  gameDoc._id = dbId
  gameDoc.record.addDate = new Date().toISOString()
  gameDoc.metadata.name = gameName
  await GameDBManager.setGame(dbId, gameDoc)

  const gameLocalDoc = { ...DEFAULT_GAME_LOCAL_VALUES }
  gameLocalDoc._id = dbId
  gameLocalDoc.path.gamePath = gamePath
  await GameDBManager.setGameLocal(dbId, gameLocalDoc)

  await launcherPreset('default', dbId)
  await saveGameIconByFile(dbId, gamePath)
}

/**
 * Get the data for batch game adding
 * @returns The data for batch game adding
 */
export async function getBatchGameAdderData(): Promise<
  {
    dataId: string
    dataSource: string
    name: string
    id: string
    status: string
    dirPath: string
  }[]
> {
  const dirPath = await selectPathDialog(['openDirectory'])
  if (!dirPath) {
    return []
  }
  const defaultDataSource = await ConfigDBManager.getConfigValue(
    'game.scraper.common.defaultDataSource'
  )
  const games = await getSubfoldersByDepth(dirPath, 1)
  const data = games.map(async (game) => {
    return {
      dataId: generateUUID(),
      dataSource: defaultDataSource,
      name: game.name,
      id: '',
      status: (await GameDBManager.checkGameExitsByPath(game.dirPath)) ? 'existed' : 'idle',
      dirPath: game.dirPath
    }
  })
  return Promise.all(data)
}
