import {
  GameMetadata,
  ScraperIdentifier,
  GameMetadataField,
  GameMetadataUpdateMode,
  GameMetadataUpdateOptions,
  BatchUpdateResults,
  BatchUpdateResult,
  GameDescriptionList,
  GameTagsList,
  GameExtraInfoList,
  GameDevelopersList,
  GamePublishersList,
  GameGenresList,
  GamePlatformsList,
  GameRelatedSitesList,
  ScraperCapabilities
} from '@appTypes/utils'
import { GameDBManager } from '~/core/database'
import { scraperManager } from '~/features/scraper'
import { ipcManager } from '~/core/ipc'
import log from 'electron-log/main'

export async function batchUpdateGameMetadata({
  gameIds,
  dataSource,
  fields = ['#all'] as (GameMetadataField | GameMetadataUpdateMode)[],
  options = {},
  concurrency = 5
}: {
  gameIds: string[]
  dataSource: string
  fields?: (GameMetadataField | GameMetadataUpdateMode)[]
  options?: GameMetadataUpdateOptions
  concurrency?: number
}): Promise<BatchUpdateResults> {
  try {
    // Prepare the results object
    const results: BatchUpdateResults = {
      totalGames: gameIds.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      results: []
    }

    // Current processing game count
    let current = 0
    const total = gameIds.length

    // Process a single game
    const processGame = async (gameId: string): Promise<BatchUpdateResult> => {
      // Get game document
      const gameDoc = await GameDBManager.getGame(gameId)

      current++

      try {
        // If no game document found, skip this game
        if (!gameDoc?.metadata?.name) {
          const result = {
            gameId,
            success: false,
            error: 'Game document not found or name is empty',
            dataSourceId: null,
            gameName: null
          }

          // Send failure progress notification
          ipcManager.send('adder:batch-update-game-metadata-progress', {
            gameId,
            gameName: null,
            dataSource,
            dataSourceId: null,
            fields,
            options,
            status: 'error',
            error: 'Game document not found or name is empty',
            current,
            total
          })

          return result
        }

        // Get game name
        const gameName = gameDoc.metadata.name

        // Check if there is an existing ID for the data source
        const existingDataSourceId = gameDoc.metadata[`${dataSource}Id`]
        if (existingDataSourceId) {
          // Update game metadata using existing data source ID
          await updateGameMetadata({
            dbId: gameId,
            dataSource,
            dataSourceId: existingDataSourceId,
            fields,
            options
          })

          // Send success progress notification
          ipcManager.send('adder:batch-update-game-metadata-progress', {
            gameId,
            gameName,
            dataSource,
            dataSourceId: existingDataSourceId,
            fields,
            options,
            status: 'success',
            current,
            total
          })

          return {
            gameId,
            success: true,
            dataSourceId: existingDataSourceId,
            gameName
          }
        }

        // Search for the game
        const searchResults = await scraperManager.searchGames(dataSource, gameName)

        // No search results found
        if (!searchResults || searchResults.length === 0) {
          const result = {
            gameId,
            success: false,
            error: 'No matching game found',
            dataSourceId: null,
            gameName
          }

          // Send failure progress notification
          ipcManager.send('adder:batch-update-game-metadata-progress', {
            gameId,
            gameName,
            dataSource,
            dataSourceId: null,
            fields,
            options,
            status: 'error',
            error: 'No matching game found',
            current,
            total
          })

          return result
        }

        // Directly use the first search result
        const selectedResult = searchResults[0]

        // Use the selected result to update game metadata
        await updateGameMetadata({
          dbId: gameId,
          dataSource,
          dataSourceId: selectedResult.id,
          fields,
          options
        })

        // Send success progress notification
        ipcManager.send('adder:batch-update-game-metadata-progress', {
          gameId,
          gameName,
          dataSource,
          dataSourceId: selectedResult.id,
          fields,
          options,
          status: 'success',
          current,
          total
        })

        return {
          gameId,
          success: true,
          dataSourceId: selectedResult.id,
          gameName
        }
      } catch (error) {
        // Construct error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Send failure progress notification
        ipcManager.send('adder:batch-update-game-metadata-progress', {
          gameId,
          gameName: gameDoc?.metadata?.name || null,
          dataSource,
          dataSourceId: null,
          fields,
          options,
          status: 'error',
          error: errorMessage,
          current,
          total
        })

        // Return error result
        return {
          gameId,
          success: false,
          error: errorMessage,
          dataSourceId: null,
          gameName: gameDoc?.metadata?.name || null
        }
      }
    }

    // Process all games in batches
    const processBatch = async (gameIds: string[]): Promise<void> => {
      let successful = 0
      let failed = 0

      // Process games in batches
      for (let i = 0; i < gameIds.length; i += concurrency) {
        const batch = gameIds.slice(i, i + concurrency)

        // Create processing tasks, passing in game ID and index
        const batchPromises = batch.map((gameId) => processGame(gameId))

        const batchResults = await Promise.all(batchPromises)

        // Process results
        batchResults.forEach((result) => {
          if (result.success) {
            successful++
          } else {
            failed++
          }
          results.results.push(result)
        })
      }

      // Update final results
      results.successfulUpdates = successful
      results.failedUpdates = failed
    }

    // Execute batch processing
    await processBatch(gameIds)

    return results
  } catch (error) {
    log.error('[MetadataUpdater] Batch update game metadata failed:', error)
    throw error
  }
}

export async function updateGameMetadata({
  dbId,
  dataSource,
  dataSourceId,
  fields = ['#all'] as (GameMetadataField | GameMetadataUpdateMode)[],
  backgroundUrl,
  options = {}
}: {
  dbId: string
  dataSource: string
  dataSourceId: string
  fields?: (GameMetadataField | GameMetadataUpdateMode)[]
  backgroundUrl?: string
  options?: GameMetadataUpdateOptions
}): Promise<void> {
  try {
    // Get current game document
    const gameDoc = await GameDBManager.getGame(dbId)

    // Parse update modes and fields
    const updateAll = fields.includes('#all' as GameMetadataUpdateMode)
    const updateMissingOnly = fields.includes('#missing' as GameMetadataUpdateMode)
    const specificFields = fields.filter(
      (f) => f !== '#all' && f !== '#missing'
    ) as GameMetadataField[]

    // Determine the list of fields to update
    const fieldsToUpdate: GameMetadataField[] = updateAll
      ? [
          'name',
          'originalName',
          'releaseDate',
          'description',
          'developers',
          'publishers',
          'genres',
          'platforms',
          'tags',
          'relatedSites',
          'extra',
          'cover',
          'background',
          'logo',
          'icon'
        ]
      : updateMissingOnly
        ? [] // Missing fields will be determined after fetching metadata
        : specificFields

    // Set default options
    const {
      overwriteExisting = true,
      updateImages = true,
      mergeStrategy = 'replace',
      sourcesPriority = []
    } = options

    // Image-related fields
    const imageFields: GameMetadataField[] = ['cover', 'background', 'logo', 'icon']

    // Fields that need to be fetched via additional API calls
    const specialFetchFields: GameMetadataField[] = [
      'description',
      'tags',
      'extra',
      'developers',
      'publishers',
      'genres',
      'platforms',
      'relatedSites'
    ]

    // Get provider capabilities information
    const providerInfo = scraperManager.getProviderInfo(dataSource)
    const providerCapabilities = providerInfo?.capabilities || []

    // Step 1: Get base metadata
    const baseMetadata = await scraperManager.getGameMetadata(dataSource, {
      type: 'id',
      value: dataSourceId
    })

    // Prepare image fetching tasks
    const imageFetchTasks: Array<{ type: GameMetadataField; promise: Promise<string[]> }> = []

    // Fetch different types of images as needed
    if (updateImages) {
      // Process image fields
      imageFields.forEach((imageField) => {
        if (updateAll || fieldsToUpdate.includes(imageField)) {
          // If backgroundUrl is provided, use it for background images
          if (imageField === 'background' && backgroundUrl) {
            imageFetchTasks.push({
              type: imageField,
              promise: Promise.resolve([backgroundUrl])
            })
          } else {
            const methodName =
              `getGame${imageField.charAt(0).toUpperCase() + imageField.slice(1)}s` as ScraperCapabilities

            // Check if the data source supports fetching this type of image
            if (providerCapabilities.includes(methodName)) {
              // The current data source supports this image type, use it directly
              imageFetchTasks.push({
                type: imageField,
                promise: (
                  scraperManager[methodName] as (
                    dataSource: string,
                    identifier: { type: string; value: string }
                  ) => Promise<string[]>
                )(dataSource, {
                  type: 'id',
                  value: dataSourceId
                })
              })
            } else if (imageField === 'logo' || imageField === 'icon') {
              // Special handling for logo and icon, use steamgriddb as an alternative
              const alternativeSource = 'steamgriddb'
              const alternativeMethod = imageField === 'logo' ? 'getGameLogos' : 'getGameIcons'

              imageFetchTasks.push({
                type: imageField,
                promise: scraperManager[alternativeMethod](
                  alternativeSource,
                  dataSource === 'steam'
                    ? { type: 'id', value: dataSourceId }
                    : {
                        type: 'name',
                        value: baseMetadata.originalName || baseMetadata.name
                      }
                )
              })
            }
          }
        }
      })
    }

    // Process image fetching results
    const imageResults = await Promise.all(
      imageFetchTasks.map((task) => task.promise.then((urls) => ({ type: task.type, urls })))
    )

    // Update metadata object
    const updatedMetadata = { ...gameDoc.metadata }

    // Determine which fields need to be updated in the case of missing fields
    if (updateMissingOnly) {
      // Check which fields are missing in the base metadata
      Object.keys(baseMetadata).forEach((key) => {
        const typedKey = key as keyof GameMetadata
        if (
          !updatedMetadata[typedKey] ||
          (Array.isArray(updatedMetadata[typedKey]) && updatedMetadata[typedKey].length === 0) ||
          updatedMetadata[typedKey] === ''
        ) {
          if (!fieldsToUpdate.includes(typedKey as GameMetadataField)) {
            fieldsToUpdate.push(typedKey as GameMetadataField)
          }
        }
      })

      // Check if special fields are missing
      if (!updatedMetadata.description || updatedMetadata.description === '') {
        fieldsToUpdate.push('description')
      }
      if (!updatedMetadata.tags || updatedMetadata.tags.length === 0) {
        fieldsToUpdate.push('tags')
      }
      if (!updatedMetadata.extra || updatedMetadata.extra.length === 0) {
        fieldsToUpdate.push('extra')
      }
      if (!updatedMetadata.developers || updatedMetadata.developers.length === 0) {
        fieldsToUpdate.push('developers')
      }
      if (!updatedMetadata.publishers || updatedMetadata.publishers.length === 0) {
        fieldsToUpdate.push('publishers')
      }
      if (!updatedMetadata.genres || updatedMetadata.genres.length === 0) {
        fieldsToUpdate.push('genres')
      }
      if (!updatedMetadata.platforms || updatedMetadata.platforms.length === 0) {
        fieldsToUpdate.push('platforms')
      }
      if (!updatedMetadata.relatedSites || updatedMetadata.relatedSites.length === 0) {
        fieldsToUpdate.push('relatedSites')
      }
    }

    // Update base metadata object
    if (updateAll) {
      // Replace all base metadata
      const basicFields = Object.keys(baseMetadata).filter(
        (key) =>
          !specialFetchFields.includes(key as GameMetadataField) &&
          !imageFields.includes(key as GameMetadataField)
      )

      basicFields.forEach((key) => {
        const typedKey = key as keyof GameMetadata
        updatedMetadata[typedKey] = baseMetadata[typedKey] as any
      })
    } else {
      // Update specified base fields
      fieldsToUpdate.forEach((field) => {
        if (
          !specialFetchFields.includes(field) &&
          !imageFields.includes(field) &&
          baseMetadata[field] !== undefined
        ) {
          // Apply merge strategy for array fields
          if (Array.isArray(baseMetadata[field])) {
            if (mergeStrategy === 'replace' || !updatedMetadata[field]) {
              updatedMetadata[field] = baseMetadata[field]
            } else if (mergeStrategy === 'append') {
              updatedMetadata[field] = [...(updatedMetadata[field] || []), ...baseMetadata[field]]
            } else if (mergeStrategy === 'merge') {
              updatedMetadata[field] = Array.from(
                new Set([...(updatedMetadata[field] || []), ...baseMetadata[field]])
              )
            }
          } else {
            // Non-array fields are replaced directly
            updatedMetadata[field] = baseMetadata[field]
          }
        }
      })
    }

    // Ensure ID field always exists
    updatedMetadata[`${dataSource}Id`] = dataSourceId

    // Ensure originalName is not null
    if (updateAll || fieldsToUpdate.includes('originalName')) {
      updatedMetadata.originalName = baseMetadata.originalName ?? ''
    }

    // Step 2: Process special fields (description, tags, extra)
    // Prepare a list of special fields that need to be fetched
    const needFetchSpecialFields: GameMetadataField[] = []

    // Process description field
    if (updateAll || fieldsToUpdate.includes('description')) {
      // Check if baseMetadata already has a description
      if (baseMetadata.description && baseMetadata.description.trim()) {
        // If the primary data source already has a description, use it directly
        updatedMetadata.description = baseMetadata.description
      } else {
        // If the primary data source does not have a description, it needs to be fetched
        needFetchSpecialFields.push('description')
      }
    }

    // Process tags field
    if (updateAll || fieldsToUpdate.includes('tags')) {
      // Check if baseMetadata already has tags
      if (baseMetadata.tags && baseMetadata.tags.length > 0) {
        // If the primary data source already has tags, process them according to the merge strategy
        if (mergeStrategy === 'replace' || !updatedMetadata.tags) {
          updatedMetadata.tags = baseMetadata.tags
        } else if (mergeStrategy === 'append') {
          updatedMetadata.tags = [...(updatedMetadata.tags || []), ...baseMetadata.tags]
        } else if (mergeStrategy === 'merge') {
          updatedMetadata.tags = Array.from(
            new Set([...(updatedMetadata.tags || []), ...baseMetadata.tags])
          )
        }
      } else {
        // If the primary data source does not have tags, it needs to be fetched
        needFetchSpecialFields.push('tags')
      }
    }

    // Process extra field
    if (updateAll || fieldsToUpdate.includes('extra')) {
      // Check if baseMetadata already has extra information
      if (baseMetadata.extra && baseMetadata.extra.length > 0) {
        // If the primary data source already has extra information, process it according to the merge strategy
        if (mergeStrategy === 'replace' || !updatedMetadata.extra) {
          updatedMetadata.extra = baseMetadata.extra
        } else {
          // Merge extra information
          const extraMap = new Map()

          // Add existing data first
          if (updatedMetadata.extra) {
            updatedMetadata.extra.forEach((e) => {
              extraMap.set(e.key, e.value)
            })
          }

          // Add new data according to the merge strategy
          baseMetadata.extra.forEach((e) => {
            if (!extraMap.has(e.key) || overwriteExisting) {
              extraMap.set(e.key, e.value)
            } else if (mergeStrategy === 'append') {
              extraMap.set(e.key, [...extraMap.get(e.key), ...e.value])
            } else if (mergeStrategy === 'merge') {
              extraMap.set(e.key, Array.from(new Set([...extraMap.get(e.key), ...e.value])))
            }
          })

          updatedMetadata.extra = Array.from(extraMap.entries()).map(([key, value]) => ({
            key,
            value
          }))
        }
      } else {
        // If the primary data source does not have extra information, it needs to be fetched
        needFetchSpecialFields.push('extra')
      }
    }

    // Process developers field
    if (updateAll || fieldsToUpdate.includes('developers')) {
      if (baseMetadata.developers && baseMetadata.developers.length > 0) {
        if (mergeStrategy === 'replace' || !updatedMetadata.developers) {
          updatedMetadata.developers = baseMetadata.developers
        } else if (mergeStrategy === 'append') {
          updatedMetadata.developers = [
            ...(updatedMetadata.developers || []),
            ...baseMetadata.developers
          ]
        } else if (mergeStrategy === 'merge') {
          updatedMetadata.developers = Array.from(
            new Set([...(updatedMetadata.developers || []), ...baseMetadata.developers])
          )
        }
      } else {
        needFetchSpecialFields.push('developers')
      }
    }

    // Process publishers field
    if (updateAll || fieldsToUpdate.includes('publishers')) {
      if (baseMetadata.publishers && baseMetadata.publishers.length > 0) {
        if (mergeStrategy === 'replace' || !updatedMetadata.publishers) {
          updatedMetadata.publishers = baseMetadata.publishers
        } else if (mergeStrategy === 'append') {
          updatedMetadata.publishers = [
            ...(updatedMetadata.publishers || []),
            ...baseMetadata.publishers
          ]
        } else if (mergeStrategy === 'merge') {
          updatedMetadata.publishers = Array.from(
            new Set([...(updatedMetadata.publishers || []), ...baseMetadata.publishers])
          )
        }
      } else {
        needFetchSpecialFields.push('publishers')
      }
    }

    // Process genres field
    if (updateAll || fieldsToUpdate.includes('genres')) {
      if (baseMetadata.genres && baseMetadata.genres.length > 0) {
        if (mergeStrategy === 'replace' || !updatedMetadata.genres) {
          updatedMetadata.genres = baseMetadata.genres
        } else if (mergeStrategy === 'append') {
          updatedMetadata.genres = [...(updatedMetadata.genres || []), ...baseMetadata.genres]
        } else if (mergeStrategy === 'merge') {
          updatedMetadata.genres = Array.from(
            new Set([...(updatedMetadata.genres || []), ...baseMetadata.genres])
          )
        }
      } else {
        needFetchSpecialFields.push('genres')
      }
    }

    // Process platforms field
    if (updateAll || fieldsToUpdate.includes('platforms')) {
      if (baseMetadata.platforms && baseMetadata.platforms.length > 0) {
        if (mergeStrategy === 'replace' || !updatedMetadata.platforms) {
          updatedMetadata.platforms = baseMetadata.platforms
        } else if (mergeStrategy === 'append') {
          updatedMetadata.platforms = [
            ...(updatedMetadata.platforms || []),
            ...baseMetadata.platforms
          ]
        } else if (mergeStrategy === 'merge') {
          updatedMetadata.platforms = Array.from(
            new Set([...(updatedMetadata.platforms || []), ...baseMetadata.platforms])
          )
        }
      } else {
        needFetchSpecialFields.push('platforms')
      }
    }

    // Process relatedSites field
    if (updateAll || fieldsToUpdate.includes('relatedSites')) {
      if (baseMetadata.relatedSites && baseMetadata.relatedSites.length > 0) {
        if (mergeStrategy === 'replace' || !updatedMetadata.relatedSites) {
          updatedMetadata.relatedSites = baseMetadata.relatedSites
        } else if (mergeStrategy === 'append') {
          updatedMetadata.relatedSites = [
            ...(updatedMetadata.relatedSites || []),
            ...baseMetadata.relatedSites
          ]
        } else if (mergeStrategy === 'merge') {
          // For relatedSites, merge by URL to avoid duplicates
          const sitesMap = new Map()
          updatedMetadata.relatedSites?.forEach((site) => sitesMap.set(site.url, site))
          baseMetadata.relatedSites.forEach((site) => sitesMap.set(site.url, site))
          updatedMetadata.relatedSites = Array.from(sitesMap.values())
        }
      } else {
        needFetchSpecialFields.push('relatedSites')
      }
    }

    // If there are still special fields to fetch, use the game name for additional searches
    if (needFetchSpecialFields.length > 0) {
      const gameName = baseMetadata.name || updatedMetadata.name

      if (gameName) {
        // Use game name as identifier
        const nameIdentifier = { type: 'name', value: gameName } as ScraperIdentifier
        const specialFetchPromises: {
          description?: Promise<GameDescriptionList>
          tags?: Promise<GameTagsList>
          extra?: Promise<GameExtraInfoList>
          developers?: Promise<GameDevelopersList>
          publishers?: Promise<GamePublishersList>
          genres?: Promise<GameGenresList>
          platforms?: Promise<GamePlatformsList>
          relatedSites?: Promise<GameRelatedSitesList>
        } = {}

        // Prepare additional fetch tasks
        if (needFetchSpecialFields.includes('description')) {
          specialFetchPromises.description = scraperManager.getGameDescriptionList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('tags')) {
          specialFetchPromises.tags = scraperManager.getGameTagsList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('extra')) {
          specialFetchPromises.extra = scraperManager.getGameExtraInfoList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('developers')) {
          specialFetchPromises.developers = scraperManager.getGameDevelopersList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('publishers')) {
          specialFetchPromises.publishers = scraperManager.getGamePublishersList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('genres')) {
          specialFetchPromises.genres = scraperManager.getGameGenresList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('platforms')) {
          specialFetchPromises.platforms = scraperManager.getGamePlatformsList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('relatedSites')) {
          specialFetchPromises.relatedSites = scraperManager.getGameRelatedSitesList(nameIdentifier)
        }

        // Execute additional fetch tasks
        const specialResults = await Promise.all(Object.values(specialFetchPromises))
        const specialResultsMap: {
          description?: GameDescriptionList
          tags?: GameTagsList
          extra?: GameExtraInfoList
          developers?: GameDevelopersList
          publishers?: GamePublishersList
          genres?: GameGenresList
          platforms?: GamePlatformsList
          relatedSites?: GameRelatedSitesList
        } = {}

        // Map results
        let resultIndex = 0
        Object.keys(specialFetchPromises).forEach((key) => {
          specialResultsMap[key] = specialResults[resultIndex++]
        })

        // Process additional fetched descriptions
        if (specialResultsMap.description) {
          const descriptions = specialResultsMap.description
          if (descriptions && descriptions.length > 0) {
            let selectedDescription = ''

            // Select based on source priority
            for (const sourceId of sourcesPriority) {
              const match = descriptions.find((d) => d.dataSource === sourceId && d.description)
              if (match) {
                selectedDescription = match.description
                break
              }
            }

            // If no specific source matched, use the first available description
            if (!selectedDescription && descriptions[0]) {
              selectedDescription = descriptions[0].description
            }

            if (selectedDescription) {
              updatedMetadata.description = selectedDescription
            }
          }
        }

        // Process additional fetched tags
        if (specialResultsMap.tags) {
          const tagsList = specialResultsMap.tags
          if (tagsList && tagsList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.tags) {
              // Use first available tag
              updatedMetadata.tags = tagsList[0].tags
            } else {
              // Merge all sources' tags
              const allTags = tagsList.flatMap((item) => item.tags)

              if (mergeStrategy === 'append') {
                updatedMetadata.tags = [...(updatedMetadata.tags || []), ...allTags]
              } else {
                // 'merge'
                updatedMetadata.tags = Array.from(
                  new Set([...(updatedMetadata.tags || []), ...allTags])
                )
              }
            }
          }
        }

        // Process additional fetched extra information
        if (specialResultsMap.extra) {
          const extraInfo = specialResultsMap.extra
          if (extraInfo && extraInfo.length > 0) {
            // Add new data according to the merge strategy
            if (mergeStrategy === 'replace' || !updatedMetadata.extra) {
              // Use first source's extra
              updatedMetadata.extra = extraInfo[0].extra
            } else {
              // Merge all sources' extra
              const extraMap = new Map()

              // Add existing data first
              if (updatedMetadata.extra) {
                updatedMetadata.extra.forEach((e) => {
                  extraMap.set(e.key, e.value)
                })
              }

              // Add new data according to the merge strategy
              extraInfo.forEach((item) => {
                item.extra.forEach((e) => {
                  if (!extraMap.has(e.key) || overwriteExisting) {
                    extraMap.set(e.key, e.value)
                  } else if (mergeStrategy === 'append') {
                    extraMap.set(e.key, [...extraMap.get(e.key), ...e.value])
                  } else if (mergeStrategy === 'merge') {
                    extraMap.set(e.key, Array.from(new Set([...extraMap.get(e.key), ...e.value])))
                  }
                })
              })

              updatedMetadata.extra = Array.from(extraMap.entries()).map(([key, value]) => ({
                key,
                value
              }))
            }
          }
        }

        // Process additional fetched developers
        if (specialResultsMap.developers) {
          const developersList = specialResultsMap.developers
          if (developersList && developersList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.developers) {
              updatedMetadata.developers = developersList[0].developers
            } else {
              const allDevelopers = developersList.flatMap((item) => item.developers)
              if (mergeStrategy === 'append') {
                updatedMetadata.developers = [
                  ...(updatedMetadata.developers || []),
                  ...allDevelopers
                ]
              } else {
                updatedMetadata.developers = Array.from(
                  new Set([...(updatedMetadata.developers || []), ...allDevelopers])
                )
              }
            }
          }
        }

        // Process additional fetched publishers
        if (specialResultsMap.publishers) {
          const publishersList = specialResultsMap.publishers
          if (publishersList && publishersList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.publishers) {
              updatedMetadata.publishers = publishersList[0].publishers
            } else {
              const allPublishers = publishersList.flatMap((item) => item.publishers)
              if (mergeStrategy === 'append') {
                updatedMetadata.publishers = [
                  ...(updatedMetadata.publishers || []),
                  ...allPublishers
                ]
              } else {
                updatedMetadata.publishers = Array.from(
                  new Set([...(updatedMetadata.publishers || []), ...allPublishers])
                )
              }
            }
          }
        }

        // Process additional fetched genres
        if (specialResultsMap.genres) {
          const genresList = specialResultsMap.genres
          if (genresList && genresList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.genres) {
              updatedMetadata.genres = genresList[0].genres
            } else {
              const allGenres = genresList.flatMap((item) => item.genres)
              if (mergeStrategy === 'append') {
                updatedMetadata.genres = [...(updatedMetadata.genres || []), ...allGenres]
              } else {
                updatedMetadata.genres = Array.from(
                  new Set([...(updatedMetadata.genres || []), ...allGenres])
                )
              }
            }
          }
        }

        // Process additional fetched platforms
        if (specialResultsMap.platforms) {
          const platformsList = specialResultsMap.platforms
          if (platformsList && platformsList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.platforms) {
              updatedMetadata.platforms = platformsList[0].platforms
            } else {
              const allPlatforms = platformsList.flatMap((item) => item.platforms)
              if (mergeStrategy === 'append') {
                updatedMetadata.platforms = [...(updatedMetadata.platforms || []), ...allPlatforms]
              } else {
                updatedMetadata.platforms = Array.from(
                  new Set([...(updatedMetadata.platforms || []), ...allPlatforms])
                )
              }
            }
          }
        }

        // Process additional fetched related sites
        if (specialResultsMap.relatedSites) {
          const relatedSitesList = specialResultsMap.relatedSites
          if (relatedSitesList && relatedSitesList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.relatedSites) {
              updatedMetadata.relatedSites = relatedSitesList[0].relatedSites
            } else {
              const allSites = relatedSitesList.flatMap((item) => item.relatedSites)
              if (mergeStrategy === 'append') {
                updatedMetadata.relatedSites = [
                  ...(updatedMetadata.relatedSites || []),
                  ...allSites
                ]
              } else {
                // For relatedSites, merge by URL to avoid duplicates
                const sitesMap = new Map()
                updatedMetadata.relatedSites?.forEach((site) => sitesMap.set(site.url, site))
                allSites.forEach((site) => sitesMap.set(site.url, site))
                updatedMetadata.relatedSites = Array.from(sitesMap.values())
              }
            }
          }
        }
      }
    }

    // Update game document
    gameDoc.metadata = updatedMetadata

    // Prepare all database write operations
    const dbPromises: Promise<unknown>[] = [GameDBManager.setGame(dbId, gameDoc)]

    // Add image save operations
    if (updateImages) {
      imageResults.forEach((result) => {
        if (result.urls.length > 0 && result.urls[0]) {
          dbPromises.push(
            GameDBManager.setGameImage(
              dbId,
              result.type as 'cover' | 'background' | 'logo' | 'icon',
              result.urls[0]
            ).catch((err) => {
              log.warn(`[Updater] Failed to save game image (${result.type}): ${err.message}`)
            })
          )
        }
      })
    }

    // Execute all database operations in parallel
    await Promise.all(dbPromises)
  } catch (error) {
    log.error('[MetadataUpdater] Failed to update game metadata:', error)
    throw error
  }
}
