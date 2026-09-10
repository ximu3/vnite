import { BatchGameInfo, DEFAULT_GAME_LOCAL_VALUES, DEFAULT_GAME_VALUES } from '@appTypes/models'
import { GameMetadata, type GameImageUpscaleOptions } from '@appTypes/utils'
import { generateUUID } from '@appUtils'
import log from 'electron-log/main'
import path from 'path'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import {
  calculateStorageSizeForPath,
  isAutoCalculateStorageSizeEnabled,
  saveGameIconByFile,
  tryUpscaleGameImage
} from '~/features/game'
import { launcherPreset } from '~/features/launcher'
import { scraperManager, type GameMetadataAggregationResult } from '~/features/scraper'
import { ScraperError, logScraperError } from '~/features/scraper/errors'
import { cacheDescriptionImages } from '~/features/scraper/services/descriptionImageCache'
import { getGameFolders, inferRootPath, selectPathDialog } from '~/utils'

type SupplementalMetadataField =
  | 'description'
  | 'tags'
  | 'extra'
  | 'developers'
  | 'publishers'
  | 'genres'
  | 'platforms'
  | 'relatedSites'

export async function addGameToDB({
  dataSource,
  dataSourceId,
  backgroundUrl,
  upscaleEnabled,
  upscaleOptionsOverride,
  playTime,
  dirPath,
  gamePath,
  targetCollection,
  scanRoot
}: {
  dataSource: string
  dataSourceId: string
  backgroundUrl?: string
  upscaleEnabled?: boolean
  upscaleOptionsOverride?: GameImageUpscaleOptions
  playTime?: number
  dirPath?: string
  gamePath?: string
  targetCollection?: string
  scanRoot?: string
}): Promise<string> {
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
    if (baseMetadata === null) throw new Error('No matching data was found.')

    // Create a copy of the base metadata to avoid modifying the original
    const metadata = JSON.parse(JSON.stringify(baseMetadata)) as GameMetadata

    // Prepare tasks to fetch missing data
    const enhancementFields: SupplementalMetadataField[] = []

    // Check and fetch missing description information
    if (!metadata.description || metadata.description.trim() === '') {
      enhancementFields.push('description')
    }

    // Check and fetch missing tags information
    if (!metadata.tags || metadata.tags.length === 0) {
      enhancementFields.push('tags')
    }

    // Check and fetch missing extra information
    if (!metadata.extra || Object.keys(metadata.extra).length === 0) {
      enhancementFields.push('extra')
    }

    // Check and fetch missing developers information
    if (!metadata.developers || metadata.developers.length === 0) {
      enhancementFields.push('developers')
    }

    // Check and fetch missing publishers information
    if (!metadata.publishers || metadata.publishers.length === 0) {
      enhancementFields.push('publishers')
    }

    // Check and fetch missing genres information
    if (!metadata.genres || metadata.genres.length === 0) {
      enhancementFields.push('genres')
    }

    // Check and fetch missing platforms information
    if (!metadata.platforms || metadata.platforms.length === 0) {
      enhancementFields.push('platforms')
    }

    // Check and fetch missing related sites information
    if (!metadata.relatedSites || metadata.relatedSites.length === 0) {
      enhancementFields.push('relatedSites')
    }

    // Execute all enhancement tasks
    const enhancementResult: GameMetadataAggregationResult<SupplementalMetadataField> =
      enhancementFields.length
        ? await scraperManager
            .getGameMetadataList(
              {
                type: 'name',
                value: metadata.originalName || metadata.name
              },
              enhancementFields,
              { [dataSource]: baseMetadata }
            )
            .catch((err) => {
              logScraperError(err, 'aggregate', 'optional game metadata', 'warn')
              return []
            })
        : []

    // Merge fetched data into metadata
    for (const { metadata: enhancementMetadata } of enhancementResult) {
      if (
        (!metadata.description || metadata.description.trim() === '') &&
        enhancementMetadata.description
      ) {
        metadata.description = enhancementMetadata.description
      }
      if ((!metadata.tags || metadata.tags.length === 0) && enhancementMetadata.tags?.length) {
        metadata.tags = enhancementMetadata.tags
      }
      if ((!metadata.extra || metadata.extra.length === 0) && enhancementMetadata.extra?.length) {
        metadata.extra = enhancementMetadata.extra
      }
      if (
        (!metadata.developers || metadata.developers.length === 0) &&
        enhancementMetadata.developers?.length
      ) {
        metadata.developers = enhancementMetadata.developers
      }
      if (
        (!metadata.publishers || metadata.publishers.length === 0) &&
        enhancementMetadata.publishers?.length
      ) {
        metadata.publishers = enhancementMetadata.publishers
      }
      if (
        (!metadata.genres || metadata.genres.length === 0) &&
        enhancementMetadata.genres?.length
      ) {
        metadata.genres = enhancementMetadata.genres
      }
      if (
        (!metadata.platforms || metadata.platforms.length === 0) &&
        enhancementMetadata.platforms?.length
      ) {
        metadata.platforms = enhancementMetadata.platforms
      }
      if (
        (!metadata.relatedSites || metadata.relatedSites.length === 0) &&
        enhancementMetadata.relatedSites?.length
      ) {
        metadata.relatedSites = enhancementMetadata.relatedSites
      }
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
    gameLocalDoc.utils.rootPath = inferRootPath(gameLocalDoc.utils.markPath, scanRoot)
    gameLocalDoc.path.gamePath = gamePath ?? ''

    // Calculate storage size if enabled
    const autoCalculateSize = await isAutoCalculateStorageSizeEnabled()
    if (autoCalculateSize && gameLocalDoc.utils.rootPath) {
      gameDoc.record.storageSize = await calculateStorageSizeForPath(gameLocalDoc.utils.rootPath)
    }

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
          logScraperError(err, 'aggregate', 'optional game covers', 'warn')
          return []
        }),
      // Use backgroundUrl if provided, otherwise fetch from scraper
      backgrounds: !backgroundUrl
        ? scraperManager
            .getGameBackgrounds(dataSource, { type: 'id', value: dataSourceId })
            .catch((err) => {
              logScraperError(err, 'aggregate', 'optional game backgrounds', 'warn')
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
          logScraperError(err, 'aggregate', 'optional game icons', 'warn')
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
          logScraperError(err, 'aggregate', 'optional game icons', 'warn')
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
          logScraperError(err, 'aggregate', 'optional game logos', 'warn')
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
          logScraperError(err, 'aggregate', 'optional game logos', 'warn')
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
      GameDBManager.setGameLocal(dbId, gameLocalDoc),
      targetCollection
        ? GameDBManager.addGameToCollection(dbId, targetCollection)
        : Promise.resolve()
    ]

    // Prepare all image saving operations
    if (covers.length > 0 && covers[0]) {
      dbPromises.push(
        GameDBManager.setGameImage(dbId, 'cover', covers[0]).catch((err) => {
          log.warn(`[Adder] Failed to save game cover: ${err.message}`)
        })
      )
    }

    if (backgroundUrl) {
      const backgroundImage = await tryUpscaleGameImage(
        backgroundUrl,
        upscaleEnabled,
        upscaleOptionsOverride
      )
      dbPromises.push(
        GameDBManager.setGameImage(dbId, 'background', backgroundImage).catch((err) => {
          log.warn(`[Adder] Failed to save game background from URL: ${err.message}`)
        })
      )
    } else if (backgrounds.length > 0 && backgrounds[0]) {
      const backgroundImage = await tryUpscaleGameImage(
        backgrounds[0],
        upscaleEnabled,
        upscaleOptionsOverride
      )
      dbPromises.push(
        GameDBManager.setGameImage(dbId, 'background', backgroundImage).catch((err) => {
          log.warn(`[Adder] Failed to save game background: ${err.message}`)
        })
      )
    }

    if (icons.length > 0 && icons[0]) {
      dbPromises.push(
        GameDBManager.setGameImage(dbId, 'icon', icons[0].toString()).catch((err) => {
          log.warn(`[Adder] Failed to save game icon: ${err.message}`)
        })
      )
    } else if (gamePath) {
      // If no icon fetched, try to save icon from the game executable
      dbPromises.push(
        saveGameIconByFile(dbId, gamePath).catch((err) => {
          log.warn(`[Adder] Failed to save game icon from executable: ${err.message}`)
        })
      )
    }

    if (logos.length > 0 && logos[0]) {
      dbPromises.push(
        GameDBManager.setGameImage(dbId, 'logo', logos[0].toString()).catch((err) => {
          log.warn(`[Adder] Failed to save game logo: ${err.message}`)
        })
      )
    }

    // Execute all database operations (in parallel)
    await Promise.all(dbPromises)

    await cacheDescriptionImages(metadata.description, dbId)

    // Set the launcher preset
    if (gamePath) await launcherPreset('default', dbId)

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

    return dbId
  } catch (error) {
    if (!(error instanceof ScraperError))
      log.error('[Adder] Failed to add game to database:', error)
    throw error
  }
}

export async function addGameToDBWithoutMetadata(
  dirPath: string,
  gamePath?: string
): Promise<void> {
  try {
    const dbId = generateUUID()
    // Get the game name from the path
    const gameName = path.basename(gamePath || dirPath)
    // Create a new game document with default values, deep copy to avoid mutation
    const gameDoc = JSON.parse(JSON.stringify(DEFAULT_GAME_VALUES))
    // Set the game document properties
    gameDoc._id = dbId
    gameDoc.record.addDate = new Date().toISOString()
    gameDoc.metadata.name = gameName

    // Create a new game local document with default values, deep copy to avoid mutation
    const gameLocalDoc = JSON.parse(JSON.stringify(DEFAULT_GAME_LOCAL_VALUES))
    // Set the game local document properties
    gameLocalDoc._id = dbId
    gameLocalDoc.path.gamePath = gamePath ?? ''
    gameLocalDoc.utils.markPath = dirPath ?? ''
    gameLocalDoc.utils.rootPath = inferRootPath(gameLocalDoc.utils.markPath)

    // Calculate storage size if enabled
    const autoCalculateSize = await isAutoCalculateStorageSizeEnabled()
    if (autoCalculateSize && gameLocalDoc.utils.rootPath) {
      gameDoc.record.storageSize = await calculateStorageSizeForPath(gameLocalDoc.utils.rootPath)
    }

    await GameDBManager.setGame(dbId, gameDoc)
    await GameDBManager.setGameLocal(dbId, gameLocalDoc)

    // Set the launcher preset and save the game icon
    if (gamePath) {
      await launcherPreset('default', dbId)
      await saveGameIconByFile(dbId, gamePath)
    }

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
    const games = await getGameFolders(dirPath)
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
