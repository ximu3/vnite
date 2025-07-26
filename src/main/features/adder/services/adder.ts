import { GameDBManager, ConfigDBManager } from '~/core/database'
import { scraperManager } from '~/features/scraper'
import { selectPathDialog, getSubfoldersByDepth } from '~/utils'
import { generateUUID } from '@appUtils'
import { launcherPreset } from '~/features/launcher'
import { saveGameIconByFile } from '~/features/game'
import { DEFAULT_GAME_VALUES, DEFAULT_GAME_LOCAL_VALUES, BatchGameInfo } from '@appTypes/models'
import { eventBus } from '~/core/events'
import { GameDescriptionList, GameExtraInfoList, GameMetadata, GameTagsList } from '@appTypes/utils'
import log from 'electron-log/main'

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
  try {
    const dbId = generateUUID()

    // Get the provider information to determine capabilities
    const providerInfo = scraperManager.getProviderInfo(dataSource)
    const providerCapabilities = providerInfo?.capabilities || []

    // Get the base metadata first
    const baseMetadata = await scraperManager.getGameMetadata(dataSource, {
      type: 'id',
      value: dataSourceId
    })

    // Create a copy of the base metadata to avoid modifying the original
    const metadata = JSON.parse(JSON.stringify(baseMetadata)) as GameMetadata

    // Prepare tasks to fetch missing data
    const enhancementTasks: Promise<any>[] = []

    // Check and fetch missing description information
    if (!metadata.description || metadata.description.trim() === '') {
      enhancementTasks.push(
        scraperManager
          .getGameDescriptionList?.({
            type: 'name',
            value: metadata.originalName || metadata.name
          })
          .catch((err) => {
            console.warn(`Failed to get game description: ${err.message}`)
            return []
          })
      )
    } else {
      enhancementTasks.push(Promise.resolve(null))
    }

    // Check and fetch missing tags information
    if (!metadata.tags || metadata.tags.length === 0) {
      enhancementTasks.push(
        scraperManager
          .getGameTagsList?.({
            type: 'name',
            value: metadata.originalName || metadata.name
          })
          .catch((err) => {
            console.warn(`Failed to get game tags: ${err.message}`)
            return []
          })
      )
    } else {
      enhancementTasks.push(Promise.resolve(null))
    }

    // Check and fetch missing extra information
    if (!metadata.extra || Object.keys(metadata.extra).length === 0) {
      enhancementTasks.push(
        scraperManager
          .getGameExtraInfoList?.({
            type: 'name',
            value: metadata.originalName || metadata.name
          })
          .catch((err) => {
            console.warn(`Failed to get game extra information: ${err.message}`)
            return {}
          })
      )
    } else {
      enhancementTasks.push(Promise.resolve(null))
    }

    // Execute all enhancement tasks
    const [descriptions, tags, extra] = (await Promise.all(enhancementTasks)) as [
      GameDescriptionList,
      GameTagsList,
      GameExtraInfoList
    ]

    // Merge fetched data into metadata
    if (descriptions && descriptions.length > 0) {
      metadata.description = descriptions[0].description
    }

    if (tags && tags.length > 0) {
      metadata.tags = tags[0].tags
    }

    if (extra && Object.keys(extra).length > 0) {
      metadata.extra = extra[0].extra
    }

    // Prepare game document, deep copy to avoid mutation
    const gameDoc = JSON.parse(JSON.stringify(DEFAULT_GAME_VALUES))
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

    const gameLocalDoc = JSON.parse(JSON.stringify(DEFAULT_GAME_LOCAL_VALUES))
    gameLocalDoc._id = dbId
    gameLocalDoc.utils.markPath = dirPath ?? ''

    // Prepare image fetching tasks
    const imagePromises: {
      covers: Promise<string[]>
      backgrounds: Promise<string[]>
      icons?: Promise<string[]>
      logos?: Promise<string[]>
    } = {
      covers: scraperManager
        .getGameCovers(dataSource, { type: 'id', value: dataSourceId })
        .catch((err) => {
          console.warn(`Failed to get game covers: ${err.message}`)
          return []
        }),
      // Use backgroundUrl if provided, otherwise fetch from scraper
      backgrounds: !backgroundUrl
        ? scraperManager
            .getGameBackgrounds(dataSource, { type: 'id', value: dataSourceId })
            .catch((err) => {
              console.warn(`Failed to get game backgrounds: ${err.message}`)
              return []
            })
        : Promise.resolve([])
    }

    // Check if the data source supports fetching icons and logos
    const hasIconCapability = providerCapabilities.includes('getGameIcons')
    const hasLogoCapability = providerCapabilities.includes('getGameLogos')

    // Choose the method to fetch icons based on data source capabilities
    if (hasIconCapability) {
      // If the current data source supports fetching icons
      imagePromises.icons = scraperManager
        .getGameIcons(dataSource, {
          type: 'id',
          value: dataSourceId
        })
        .catch((err) => {
          console.warn(`Failed to get game icons: ${err.message}`)
          return []
        })
    } else {
      // Use fallback data source steamgriddb to fetch icons
      imagePromises.icons = scraperManager
        .getGameIcons(
          'steamgriddb',
          dataSource === 'steam'
            ? { type: 'id', value: dataSourceId }
            : { type: 'name', value: metadata.originalName || metadata.name }
        )
        .catch((err) => {
          console.warn(`Failed to get game icons: ${err.message}`)
          return []
        })
    }

    // Choose the method to fetch logos based on data source capabilities
    if (hasLogoCapability) {
      // If the current data source supports fetching logos
      imagePromises.logos = scraperManager
        .getGameLogos(dataSource, {
          type: 'id',
          value: dataSourceId
        })
        .catch((err) => {
          console.warn(`Failed to get game logos: ${err.message}`)
          return []
        })
    } else {
      // Use fallback data source steamgriddb to fetch logos
      imagePromises.logos = scraperManager
        .getGameLogos(
          'steamgriddb',
          dataSource === 'steam'
            ? { type: 'id', value: dataSourceId }
            : { type: 'name', value: metadata.originalName || metadata.name }
        )
        .catch((err) => {
          console.warn(`Failed to get game logos: ${err.message}`)
          return []
        })
    }

    // Fetch all image resources in parallel
    const imageResults = await Promise.all([
      imagePromises.covers,
      imagePromises.backgrounds,
      imagePromises.icons,
      imagePromises.logos
    ])

    const [covers, backgrounds, icons, logos] = imageResults

    // Prepare all database write operations
    const dbPromises: Promise<unknown>[] = [
      GameDBManager.setGame(dbId, gameDoc),
      GameDBManager.setGameLocal(dbId, gameLocalDoc)
    ]

    // Prepare all image saving operations
    if (covers.length > 0 && covers[0]) {
      dbPromises.push(GameDBManager.setGameImage(dbId, 'cover', covers[0]))
    }

    if (backgroundUrl) {
      dbPromises.push(GameDBManager.setGameImage(dbId, 'background', backgroundUrl))
    } else if (backgrounds.length > 0 && backgrounds[0]) {
      dbPromises.push(GameDBManager.setGameImage(dbId, 'background', backgrounds[0]))
    }

    if (icons.length > 0 && icons[0]) {
      dbPromises.push(GameDBManager.setGameImage(dbId, 'icon', icons[0].toString()))
    }

    if (logos.length > 0 && logos[0]) {
      dbPromises.push(GameDBManager.setGameImage(dbId, 'logo', logos[0].toString()))
    }

    // Execute all database operations (in parallel)
    await Promise.all(dbPromises)

    // Emit event to notify other parts of the application
    eventBus.emit(
      'game:added',
      {
        gameId: dbId,
        name: gameDoc.metadata.name,
        dataSource,
        metadata
      },
      { source: 'adder' }
    )
  } catch (error) {
    log.error('[Adder] Failed to add game to database:', error)
    throw error
  }
}

export async function addGameToDBWithoutMetadata(gamePath: string): Promise<void> {
  try {
    const dbId = generateUUID()
    // Get the game name from the path
    const gameName = gamePath.split('\\').pop() ?? ''
    // Create a new game document with default values, deep copy to avoid mutation
    const gameDoc = JSON.parse(JSON.stringify(DEFAULT_GAME_VALUES))
    // Set the game document properties
    gameDoc._id = dbId
    gameDoc.record.addDate = new Date().toISOString()
    gameDoc.metadata.name = gameName
    await GameDBManager.setGame(dbId, gameDoc)

    // Create a new game local document with default values, deep copy to avoid mutation
    const gameLocalDoc = JSON.parse(JSON.stringify(DEFAULT_GAME_LOCAL_VALUES))
    // Set the game local document properties
    gameLocalDoc._id = dbId
    gameLocalDoc.path.gamePath = gamePath
    await GameDBManager.setGameLocal(dbId, gameLocalDoc)

    // Set the launcher preset and save the game icon
    await launcherPreset('default', dbId)
    await saveGameIconByFile(dbId, gamePath)

    eventBus.emit(
      'game:added',
      {
        gameId: dbId,
        name: gameDoc.metadata.name
      },
      { source: 'adder' }
    )
  } catch (error) {
    log.error('[Adder] Failed to add game to database without metadata:', error)
    throw error
  }
}

export async function getBatchGameAdderData(): Promise<BatchGameInfo[]> {
  try {
    const dirPath = await selectPathDialog(['openDirectory'])
    if (!dirPath) {
      return []
    }
    const defaultDataSource = await ConfigDBManager.getConfigValue(
      'game.scraper.common.defaultDataSource'
    )
    // Get the subfolders in the selected directory
    const games = await getSubfoldersByDepth(dirPath, 1)
    const data = games.map(async (game) => {
      return {
        dataId: generateUUID(),
        dataSource: defaultDataSource,
        name: game.name,
        id: '',
        // Check if the game exists in the database, use dirPath
        status: ((await GameDBManager.checkGameExitsByPath(game.dirPath)) ? 'existed' : 'idle') as
          | 'existed'
          | 'idle',
        dirPath: game.dirPath
      }
    })
    return Promise.all(data)
  } catch (error) {
    log.error('[Adder] Failed to get batch game adder data:', error)
    throw error
  }
}
