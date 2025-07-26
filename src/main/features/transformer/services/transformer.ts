import { configDocs } from '@appTypes/models'
import { GameDescriptionList, GameExtraInfoList, GameMetadata, GameTagsList } from '@appTypes/utils'
import { generateUUID } from '@appUtils'
import log from 'electron-log/main'
import fse from 'fs-extra'
import i18next from 'i18next'
import path from 'path'
import { z } from 'zod'
import { ConfigDBManager } from '~/core/database'
import { GameDBManager } from '~/core/database'

export class Transformer {
  static async transformMetadata(
    metadata: GameMetadata,
    transformerIds: string[] | '#all'
  ): Promise<GameMetadata> {
    try {
      // Get transformer enabled status and configuration list
      const enabled = await ConfigDBManager.getConfigValue('metadata.transformer.enabled')
      if (!enabled) {
        return metadata
      }

      // Get transformer configuration list
      const transformerList = await ConfigDBManager.getConfigValue('metadata.transformer.list')
      if (!transformerList || transformerList.length === 0) {
        return metadata
      }
      let activeTransformers = [] as configDocs['metadata']['transformer']['list']
      if (transformerIds === '#all') {
        // If transformerIds is '#all', use all transformers
        activeTransformers = transformerList
      } else {
        activeTransformers = transformerList.filter((t) => transformerIds.includes(t.id))
      }

      // Create deep copy to avoid modifying the original object
      const transformedMetadata: GameMetadata = JSON.parse(JSON.stringify(metadata))

      // Apply rules from all transformers
      for (const transformer of activeTransformers) {
        // Process basic fields
        this.applyProcessorRules(transformedMetadata, 'name', transformer.processors.name)
        this.applyProcessorRules(
          transformedMetadata,
          'originalName',
          transformer.processors.originalName
        )
        this.applyProcessorRules(
          transformedMetadata,
          'description',
          transformer.processors.description
        )
        this.applyProcessorRules(
          transformedMetadata,
          'developers',
          transformer.processors.developers
        )
        this.applyProcessorRules(
          transformedMetadata,
          'publishers',
          transformer.processors.publishers
        )
        this.applyProcessorRules(transformedMetadata, 'platforms', transformer.processors.platforms)
        this.applyProcessorRules(transformedMetadata, 'genres', transformer.processors.genres)
        this.applyProcessorRules(transformedMetadata, 'tags', transformer.processors.tags)

        // Process extra fields (director, scenario, illustration, music, engine, etc.)
        if (transformedMetadata.extra) {
          transformedMetadata.extra = await this.processExtraFields(
            transformedMetadata.extra,
            transformer.processors
          )
        }
      }

      return transformedMetadata
    } catch (error) {
      log.error('[Transformer] Error transforming metadata:', error)
      throw error
    }
  }

  static async transformTagsList(tags: GameTagsList): Promise<GameTagsList> {
    try {
      // Get transformer enabled status
      const enabled = await ConfigDBManager.getConfigValue('metadata.transformer.enabled')
      if (!enabled) {
        return tags
      }

      // Get transformer configuration list
      const transformerList = await ConfigDBManager.getConfigValue('metadata.transformer.list')
      if (!transformerList || transformerList.length === 0) {
        return tags
      }

      // Create deep copy to avoid modifying the original object
      const transformedTags: GameTagsList = JSON.parse(JSON.stringify(tags))

      // Apply rules from all transformers
      for (const transformer of transformerList) {
        // Process tags array
        for (const tagSource of transformedTags) {
          if (tagSource.tags && Array.isArray(tagSource.tags)) {
            tagSource.tags = tagSource.tags
              .map((tag) => {
                let transformedTag = tag
                if (transformer.processors.tags) {
                  for (const rule of transformer.processors.tags) {
                    for (const pattern of rule.match) {
                      transformedTag = transformedTag.replace(
                        new RegExp(pattern, 'g'),
                        rule.replace
                      )
                    }
                  }
                }
                return transformedTag === '' ? null : transformedTag
              })
              // Filter out empty values
              .filter(
                (tag: string | null) => tag !== null && tag !== undefined && tag !== ''
              ) as string[]
          }
        }
      }

      return transformedTags
    } catch (error) {
      log.error('[Transformer] Error transforming tags:', error)
      throw error
    }
  }

  static async transformDescriptionList(
    descriptions: GameDescriptionList
  ): Promise<GameDescriptionList> {
    try {
      // Get transformer enabled status
      const enabled = await ConfigDBManager.getConfigValue('metadata.transformer.enabled')
      if (!enabled) {
        return descriptions
      }

      // Get transformer configuration list
      const transformerList = await ConfigDBManager.getConfigValue('metadata.transformer.list')
      if (!transformerList || transformerList.length === 0) {
        return descriptions
      }

      // Create deep copy to avoid modifying the original object
      const transformedDescriptions: GameDescriptionList = JSON.parse(JSON.stringify(descriptions))

      // Apply rules from all transformers
      for (const transformer of transformerList) {
        // Process descriptions
        for (const descItem of transformedDescriptions) {
          if (descItem.description && typeof descItem.description === 'string') {
            let transformedDesc = descItem.description

            if (transformer.processors.description) {
              for (const rule of transformer.processors.description) {
                for (const pattern of rule.match) {
                  transformedDesc = transformedDesc.replace(new RegExp(pattern, 'g'), rule.replace)
                }
              }
            }

            // If the transformed description is empty, set to null for later filtering
            descItem.description = (transformedDesc === '' ? null : transformedDesc) as string
          }
        }
      }

      // Filter out items with empty descriptions
      return transformedDescriptions.filter(
        (descItem) => descItem.description !== null && descItem.description !== ''
      )
    } catch (error) {
      log.error('[Transformer] Error transforming descriptions:', error)
      throw error
    }
  }

  static async transformExtraInfoList(extraInfo: GameExtraInfoList): Promise<GameExtraInfoList> {
    try {
      // Get transformer enabled status
      const enabled = await ConfigDBManager.getConfigValue('metadata.transformer.enabled')
      if (!enabled) {
        return extraInfo
      }

      // Get transformer configuration list
      const transformerList = await ConfigDBManager.getConfigValue('metadata.transformer.list')
      if (!transformerList || transformerList.length === 0) {
        return extraInfo
      }

      // Create deep copy to avoid modifying the original object
      const transformedExtraInfo: GameExtraInfoList = JSON.parse(JSON.stringify(extraInfo))

      // Get all localized field mappings
      const localizedKeyMap = this.getLocalizedExtraFieldsMap()

      // Apply rules from all transformers
      for (const transformer of transformerList) {
        // Process extra information for each data source
        for (const extraItem of transformedExtraInfo) {
          if (extraItem.extra && Array.isArray(extraItem.extra)) {
            // Process each extra field
            for (const field of extraItem.extra) {
              // Find the corresponding original key (non-localized key name)
              const originalKey = this.findOriginalKey(field.key, localizedKeyMap)

              // If the corresponding original key is found and has matching processing rules
              if (originalKey && transformer.processors[originalKey]) {
                const rules = transformer.processors[originalKey]

                // Apply processing rules to the value array
                if (field.value && Array.isArray(field.value)) {
                  field.value = field.value
                    .map((value) => {
                      let newValue = value
                      for (const rule of rules) {
                        for (const pattern of rule.match) {
                          newValue = newValue.replace(new RegExp(pattern, 'g'), rule.replace)
                        }
                      }
                      return newValue === '' ? null : newValue
                    })
                    // Filter out empty values
                    .filter(
                      (value: string | null) =>
                        value !== null && value !== undefined && value !== ''
                    ) as string[]
                }
              }
            }

            // Filter out fields with empty value arrays
            extraItem.extra = extraItem.extra.filter(
              (field) => field.value && Array.isArray(field.value) && field.value.length > 0
            )
          }
        }
      }

      // Filter out items without extra information
      return transformedExtraInfo.filter(
        (item) => item.extra && Array.isArray(item.extra) && item.extra.length > 0
      )
    } catch (error) {
      log.error('[Transformer] Error transforming extra info:', error)
      throw error
    }
  }

  private static applyProcessorRules(
    metadata: any,
    field: string,
    rules: { match: string[]; replace: string }[]
  ): void {
    if (!rules || !rules.length || !metadata[field]) {
      return
    }

    // Process string type fields
    if (typeof metadata[field] === 'string') {
      let value = metadata[field]
      for (const rule of rules) {
        for (const pattern of rule.match) {
          value = value.replace(new RegExp(pattern, 'g'), rule.replace)
        }
      }
      // If the value is empty after replacement, set it to undefined so the field will be removed
      metadata[field] = value === '' ? undefined : value
    }
    // Process string array type fields
    else if (Array.isArray(metadata[field])) {
      const processedArray = metadata[field]
        .map((item: string) => {
          if (typeof item !== 'string') return item

          let value = item
          for (const rule of rules) {
            for (const pattern of rule.match) {
              value = value.replace(new RegExp(pattern, 'g'), rule.replace)
            }
          }
          // If the value is empty after replacement, return null for subsequent filtering
          return value === '' ? null : value
        })
        // Filter out empty values
        .filter((item: any) => item !== null && item !== undefined)

      // Deduplicate
      metadata[field] = [...new Set(processedArray)]
    }
  }

  static async transformGameById(
    gameId: string,
    transformerIds: string[] | '#all'
  ): Promise<boolean> {
    try {
      const game = await GameDBManager.getGame(gameId)
      if (!game) {
        throw new Error(`Game with ID ${gameId} not found`)
      }

      // Build metadata object
      const metadata: GameMetadata = {
        name: game.metadata.name,
        originalName: game.metadata.originalName,
        releaseDate: game.metadata.releaseDate,
        description: game.metadata.description,
        developers: game.metadata.developers,
        publishers: game.metadata.publishers || [],
        platforms: game.metadata.platforms || [],
        genres: game.metadata.genres || [],
        relatedSites: game.metadata.relatedSites,
        tags: game.metadata.tags,
        extra: game.metadata.extra
      }

      // Transform metadata
      const transformedMetadata = await this.transformMetadata(metadata, transformerIds)

      // Compare original and transformed metadata
      if (JSON.stringify(metadata) === JSON.stringify(transformedMetadata)) {
        // No changes detected, skip database update
        console.log(`No metadata changes for game ${gameId}, skipping update`)
        return true
      }

      // Save transformed metadata directly to database
      await this.applyMetadataToGame(gameId, transformedMetadata)

      return true
    } catch (error) {
      log.error(`[Transformer] Error transforming game ${gameId} metadata:`, error)
      return false
    }
  }

  static async transformAllGames(transformerIds: string[] | '#all'): Promise<number> {
    try {
      const allGames = await GameDBManager.getAllGames()
      let successCount = 0

      for (const gameId in allGames) {
        if (gameId !== 'collections') {
          // Skip special documents
          try {
            const success = await this.transformGameById(gameId, transformerIds)
            if (success) {
              successCount++
            }
          } catch (error) {
            log.error(`[Transformer] Error transforming game ${gameId}:`, error)
            // Continue processing next game
          }
        }
      }

      return successCount
    } catch (error) {
      log.error('[Transformer] Error transforming all games:', error)
      throw error
    }
  }

  private static async processExtraFields(
    extraFields: { key: string; value: string[] }[],
    processors: any
  ): Promise<{ key: string; value: string[] }[]> {
    try {
      if (!extraFields || !Array.isArray(extraFields)) {
        return []
      }

      // Define keys that need localization
      const keysToLocalize = ['scenario', 'illustration', 'voice', 'music', 'director']

      // Get all possible localization field mappings
      const localizedKeyMap = this.getLocalizedExtraFieldsMap()
      const result: { key: string; value: string[] }[] = []

      // Process each extra field
      for (const field of extraFields) {
        // Find the corresponding original key (non-localized key name)
        const originalKey = this.findOriginalKey(field.key, localizedKeyMap)

        // If the corresponding original key is found and there are matching processing rules
        if (originalKey && processors[originalKey]) {
          const rules = processors[originalKey]

          // Apply processing rules to value array
          const newValues = field.value.map((value) => {
            let newValue = value
            for (const rule of rules) {
              for (const pattern of rule.match) {
                newValue = newValue.replace(new RegExp(pattern, 'g'), rule.replace)
              }
            }
            return newValue
          })

          // Check if localization is needed for the field
          let keyToUse = field.key
          if (keysToLocalize.includes(originalKey)) {
            keyToUse = i18next.t(`scraper:extraMetadataFields.${originalKey}`)
          }

          result.push({
            key: keyToUse, // Use localized key name or original key name
            value: newValues
          })
        } else {
          // No matching processing rules found, keep original
          // Check if localization is needed for the field
          if (keysToLocalize.includes(field.key)) {
            result.push({
              key: i18next.t(`scraper:extraMetadataFields.${field.key}`),
              value: field.value
            })
          } else {
            result.push(field)
          }
        }
      }

      return result
    } catch (error) {
      log.error('[Transformer] Error processing extra fields:', error)
      return extraFields || []
    }
  }

  private static findOriginalKey(
    localizedKey: string,
    localizedKeyMap: Record<string, Record<string, string>>
  ): string | null {
    // Check mappings for each language
    for (const lang in localizedKeyMap) {
      const mapping = localizedKeyMap[lang]
      for (const originalKey in mapping) {
        // If localized key name matches
        if (mapping[originalKey] === localizedKey) {
          return originalKey
        }
      }
    }

    // If localized key name is the same as original key name (untranslated case)
    if (['director', 'scenario', 'illustration', 'music', 'engine'].includes(localizedKey)) {
      return localizedKey
    }

    return null
  }

  private static getEffectiveLanguage(requestedLang: string): string {
    try {
      // Use language fallback mechanism provided by i18next
      const availableLanguages = i18next.languages || []

      // Check if requested language is in available languages
      if (availableLanguages.includes(requestedLang)) {
        return requestedLang
      }

      // Check for matching language variants (e.g., zh -> zh-CN)
      const matchingLang = availableLanguages.find((lang) => lang.startsWith(requestedLang))
      if (matchingLang) {
        return matchingLang
      }

      // Use i18next current language or default to English
      return i18next.language || 'en'
    } catch (error) {
      log.error('[Transformer] Error getting effective language:', error)
      return 'en'
    }
  }

  private static getLocalizedExtraFields(): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}

    try {
      // Get all currently supported languages
      const languages = i18next.languages || ['en']

      // For each language, try to get extraMetadataFields resource via i18next
      languages.forEach((lang) => {
        try {
          // Check if translation resource for extraMetadataFields exists
          const resources = i18next.getResourceBundle(lang, 'scraper')

          if (resources && resources.extraMetadataFields) {
            result[lang] = resources.extraMetadataFields
          }
        } catch (error) {
          log.warn(`[Transformer] Error loading localization file for ${lang} language:`, error)
        }
      })

      // If no resources found, try to get directly from default language
      if (Object.keys(result).length === 0) {
        const defaultLang = i18next.language || 'en'
        const defaultResources = i18next.getResourceBundle(defaultLang, 'scraper')

        if (defaultResources && defaultResources.extraMetadataFields) {
          result[defaultLang] = defaultResources.extraMetadataFields
        }
      }
    } catch (error) {
      log.error('[Transformer] Error getting localized extra fields:', error)
    }

    return result
  }

  private static getLocalizedExtraFieldsMap(): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}
    const fields = this.getLocalizedExtraFields()

    // Reverse mapping for each language, from {originalKey: localizedKey} to {localizedKey: originalKey}
    for (const lang in fields) {
      result[lang] = {}
      for (const key in fields[lang]) {
        result[lang][key] = fields[lang][key]
      }
    }

    return result
  }

  static async applyMetadataToGame(gameId: string, metadata: GameMetadata): Promise<void> {
    try {
      const game = await GameDBManager.getGame(gameId)

      // Update game metadata
      game.metadata.name = metadata.name
      game.metadata.originalName = metadata.originalName || ''
      game.metadata.releaseDate = metadata.releaseDate
      game.metadata.description = metadata.description
      game.metadata.developers = metadata.developers

      if (metadata.publishers) game.metadata.publishers = metadata.publishers
      if (metadata.platforms) game.metadata.platforms = metadata.platforms
      if (metadata.genres) game.metadata.genres = metadata.genres
      game.metadata.relatedSites = metadata.relatedSites
      game.metadata.tags = metadata.tags

      // Special handling for extra fields
      if (metadata.extra) {
        game.metadata.extra = metadata.extra
      }

      // Save updated game
      await GameDBManager.setGame(gameId, game)
    } catch (error) {
      log.error(`[Transformer] Error applying metadata to game ${gameId}:`, error)
      throw error
    }
  }

  static getLocalizedFieldLabel(key: string, lang?: string): string {
    try {
      const currentLang = lang || i18next.language || 'en'
      const effectiveLang = this.getEffectiveLanguage(currentLang)

      const localizedFields = this.getLocalizedExtraFields()
      const fieldLabels = localizedFields[effectiveLang] || {}

      return fieldLabels[key] || key
    } catch (error) {
      log.error(`[Transformer] Error getting localized label for field ${key}:`, error)
      return key
    }
  }

  static async exportTransformerToFile(
    transformer: configDocs['metadata']['transformer']['list'][number],
    targetPath: string
  ): Promise<void> {
    try {
      const data = JSON.stringify(transformer)
      await fse.writeFile(path.join(targetPath, `${transformer.name}.json`), data, 'utf-8')
      log.info(`[Transformer] exported to ${targetPath}/${transformer.name}.json`)
    } catch (error) {
      log.error(`[Transformer] Error exporting transformer to file:`, error)
      throw error
    }
  }

  static async importTransformerFromFile(filePath: string): Promise<void> {
    try {
      const data = await fse.readFile(filePath, 'utf-8')
      const transformer = JSON.parse(data)
      // Validate format
      const result = TransformerSchema.safeParse(transformer)
      if (!result.success) {
        throw new Error('Invalid transformer format')
      }
      transformer.id = generateUUID()
      // Add transformer to configuration
      const transformerList = await ConfigDBManager.getConfigValue('metadata.transformer.list')
      if (!transformerList) {
        throw new Error('Transformer list not found')
      }
      transformerList.push(transformer)
      await ConfigDBManager.setConfigValue('metadata.transformer.list', transformerList)
      log.info(`[Transformer] imported from ${filePath}`)
    } catch (error) {
      log.error(`[Transformer] Error importing transformer from file:`, error)
      throw error
    }
  }
}

const ProcessorEntrySchema = z.object({
  match: z.array(z.string()),
  replace: z.string()
})

// Transformer schema
const TransformerSchema = z.object({
  id: z.string(),
  name: z.string(),
  note: z.string(),
  processors: z.object({
    name: z.array(ProcessorEntrySchema),
    originalName: z.array(ProcessorEntrySchema),
    description: z.array(ProcessorEntrySchema),
    developers: z.array(ProcessorEntrySchema),
    publishers: z.array(ProcessorEntrySchema),
    platforms: z.array(ProcessorEntrySchema),
    genres: z.array(ProcessorEntrySchema),
    tags: z.array(ProcessorEntrySchema),
    director: z.array(ProcessorEntrySchema),
    scenario: z.array(ProcessorEntrySchema),
    illustration: z.array(ProcessorEntrySchema),
    music: z.array(ProcessorEntrySchema),
    engine: z.array(ProcessorEntrySchema)
  })
})
