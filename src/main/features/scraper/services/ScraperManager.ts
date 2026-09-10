import {
  GameDescriptionList,
  GameDevelopersList,
  GameExtraInfoList,
  GameGenresList,
  GameInformationList,
  GameList,
  GameMetadata,
  GamePlatformsList,
  GamePublishersList,
  GameRelatedSitesList,
  GameTagsList,
  ScraperIdentifier
} from '@appTypes/utils'
import { Transformer } from '~/features/transformer'
import { ScraperError, logScraperError } from '../errors'
import {
  GameMetadataAggregationField,
  GameMetadataAggregationResult,
  GameMetadataAggregationSeed,
  ScraperCapabilities,
  ScraperProvider
} from './types'

const SCRAPER_AGGREGATION_TIMEOUT = 5_000

type AggregatedMetadataSource = {
  dataSource: string
  metadata: GameMetadata
}

async function withAggregationTimeout<T>(
  request: Promise<T>,
  timeout = SCRAPER_AGGREGATION_TIMEOUT
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ScraperError('timeout')), timeout)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

export class ScraperManager {
  private providers: Map<string, ScraperProvider> = new Map()

  public registerProvider(provider: ScraperProvider): void {
    this.providers.set(provider.id, provider)
  }

  public unregisterProvider(providerId: string): void {
    this.providers.delete(providerId)
  }

  public getProvider(providerId: string): ScraperProvider | undefined {
    return this.providers.get(providerId)
  }

  public getAllProviders(): ScraperProvider[] {
    return Array.from(this.providers.values())
  }

  public getProviderIds(): string[] {
    return Array.from(this.providers.keys())
  }

  public hasProvider(providerId: string): boolean {
    return this.providers.has(providerId)
  }

  public async searchGames(
    providerId: string,
    gameName: string,
    gamePath?: string
  ): Promise<GameList> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.searchGames) {
        throw new Error(`Provider '${providerId}' does not support searching games`)
      }
      return await provider.searchGames(gameName, gamePath)
    } catch (error) {
      throw logScraperError(error, this.getProvider(providerId)?.name || providerId, 'search games')
    }
  }

  public async checkGameExists(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<boolean> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.checkGameExists) {
        throw new Error(`Provider '${providerId}' does not support checking game existence`)
      }
      return await provider.checkGameExists(identifier)
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'check game existence'
      )
    }
  }

  public async getGameMetadata(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<GameMetadata | null> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.getGameMetadata) {
        throw new Error(`Provider '${providerId}' does not support getting game metadata`)
      }
      const metadata = await provider.getGameMetadata(identifier)
      if (metadata === null) return null
      return Transformer.transformMetadata(metadata, '#all')
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'get game metadata'
      )
    }
  }

  public async getGameBackgrounds(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<string[]> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.getGameBackgrounds) {
        throw new Error(`Provider '${providerId}' does not support getting game backgrounds`)
      }
      return await provider.getGameBackgrounds(identifier)
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'get game backgrounds'
      )
    }
  }

  public async getGameWideCovers(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<string[]> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.getGameWideCovers) {
        throw new Error(`Provider '${providerId}' does not support getting game wide covers`)
      }
      return await provider.getGameWideCovers(identifier)
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'get game wide covers'
      )
    }
  }

  public async getGameCovers(providerId: string, identifier: ScraperIdentifier): Promise<string[]> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.getGameCovers) {
        throw new Error(`Provider '${providerId}' does not support getting game covers`)
      }
      return await provider.getGameCovers(identifier)
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'get game covers'
      )
    }
  }

  public async getGameLogos(providerId: string, identifier: ScraperIdentifier): Promise<string[]> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.getGameLogos) {
        throw new Error(`Provider '${providerId}' does not support getting game logos`)
      }
      return await provider.getGameLogos(identifier)
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'get game logos'
      )
    }
  }

  public async getGameIcons(providerId: string, identifier: ScraperIdentifier): Promise<string[]> {
    try {
      const provider = this.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider '${providerId}' not found`)
      }
      if (!provider.getGameIcons) {
        throw new Error(`Provider '${providerId}' does not support getting game icons`)
      }
      return await provider.getGameIcons(identifier)
    } catch (error) {
      throw logScraperError(
        error,
        this.getProvider(providerId)?.name || providerId,
        'get game icons'
      )
    }
  }

  public clearProviders(): void {
    this.providers.clear()
  }

  private getProviderCapabilities(provider: ScraperProvider): ScraperCapabilities[] {
    return Object.keys(provider)
      .filter((key) => key !== 'id' && key !== 'name')
      .filter((key) => typeof provider[key] === 'function')
      .map((key) => key as ScraperCapabilities)
  }

  public getProviderInfo(providerId: string): {
    id: string
    name: string
    capabilities: ScraperCapabilities[]
  } {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    return {
      id: provider.id,
      name: provider.name,
      capabilities: this.getProviderCapabilities(provider)
    }
  }

  public getProviderInfosWithCapabilities(
    capabilities: ScraperCapabilities[],
    requireAll: boolean = true
  ): { id: string; name: string; capabilities: ScraperCapabilities[] }[] {
    return this.getAllProviders()
      .filter((provider) => {
        const providerCapabilities = this.getProviderCapabilities(provider)

        if (requireAll) {
          return capabilities.every((capability) => providerCapabilities.includes(capability))
        } else {
          return capabilities.some((capability) => providerCapabilities.includes(capability))
        }
      })
      .map((provider) => ({
        id: provider.id,
        name: provider.name,
        capabilities: capabilities.filter((capability) =>
          this.getProviderCapabilities(provider).includes(capability)
        )
      }))
  }

  private getProviderIdsWithCapabilities(
    capabilities: ScraperCapabilities[],
    requireAll: boolean = true
  ): string[] {
    return this.getProviderInfosWithCapabilities(capabilities, requireAll).map(
      (providerInfo) => providerInfo.id
    )
  }

  private async getAggregatedMetadataSources(
    identifier: ScraperIdentifier,
    preloadedMetadata: GameMetadataAggregationSeed = {}
  ): Promise<AggregatedMetadataSource[]> {
    const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])

    // Execute all requests in parallel
    const metadataSources = await Promise.all(
      providerIds.map(async (providerId): Promise<AggregatedMetadataSource | null> => {
        try {
          const metadata = Object.hasOwn(preloadedMetadata, providerId)
            ? (preloadedMetadata[providerId] ?? null)
            : await withAggregationTimeout(this.getGameMetadata(providerId, identifier))

          return metadata ? { dataSource: providerId, metadata } : null
        } catch (error) {
          logScraperError(error, providerId, 'getGameMetadata', 'warn')
          return null
        }
      })
    )

    // Extract successful results
    return metadataSources.filter((source): source is AggregatedMetadataSource => source !== null)
  }

  /**
   * Fetch selected metadata fields with at most one metadata request per provider.
   * Preloaded metadata is reused instead of requesting the matching provider again.
   */
  public async getGameMetadataList<Fields extends GameMetadataAggregationField>(
    identifier: ScraperIdentifier,
    fields: readonly Fields[],
    preloadedMetadata: GameMetadataAggregationSeed = {}
  ): Promise<GameMetadataAggregationResult<Fields>> {
    try {
      const requestedFields = new Set(fields)

      if (requestedFields.size === 0) {
        return []
      }

      const metadataSources = await this.getAggregatedMetadataSources(identifier, preloadedMetadata)

      return metadataSources.map(({ dataSource, metadata }) => ({
        dataSource,
        metadata: Object.fromEntries(
          Array.from(requestedFields).map((field) => [field, metadata[field]])
        ) as Pick<GameMetadata, Fields>
      }))
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'metadata list')
    }
  }

  public async getGameDescriptionList(identifier: ScraperIdentifier): Promise<GameDescriptionList> {
    const metadataList = await this.getGameMetadataList(identifier, ['description'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        description: metadata.description || ''
      }))
      .filter((item) => item.description)
    return await Transformer.transformDescriptionList(candidates)
  }

  public async getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList> {
    const metadataList = await this.getGameMetadataList(identifier, ['tags'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        tags: metadata.tags || []
      }))
      .filter((item) => item.tags.length > 0)
    return await Transformer.transformTagsList(candidates)
  }

  public async getGameExtraInfoList(identifier: ScraperIdentifier): Promise<GameExtraInfoList> {
    const metadataList = await this.getGameMetadataList(identifier, ['extra'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        extra: metadata.extra || []
      }))
      .filter((item) => item.extra.length > 0)
    return await Transformer.transformExtraInfoList(candidates)
  }

  public async getGameDevelopersList(identifier: ScraperIdentifier): Promise<GameDevelopersList> {
    const metadataList = await this.getGameMetadataList(identifier, ['developers'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        developers: metadata.developers || []
      }))
      .filter((item) => item.developers.length > 0)
    return await Transformer.transformDevelopersList(candidates)
  }

  public async getGamePublishersList(identifier: ScraperIdentifier): Promise<GamePublishersList> {
    const metadataList = await this.getGameMetadataList(identifier, ['publishers'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        publishers: metadata.publishers || []
      }))
      .filter((item) => item.publishers.length > 0)
    return await Transformer.transformPublishersList(candidates)
  }

  public async getGameGenresList(identifier: ScraperIdentifier): Promise<GameGenresList> {
    const metadataList = await this.getGameMetadataList(identifier, ['genres'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        genres: metadata.genres || []
      }))
      .filter((item) => item.genres.length > 0)
    return await Transformer.transformGenresList(candidates)
  }

  public async getGamePlatformsList(identifier: ScraperIdentifier): Promise<GamePlatformsList> {
    const metadataList = await this.getGameMetadataList(identifier, ['platforms'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        platforms: metadata.platforms || []
      }))
      .filter((item) => item.platforms.length > 0)
    return await Transformer.transformPlatformsList(candidates)
  }

  public async getGameRelatedSitesList(
    identifier: ScraperIdentifier
  ): Promise<GameRelatedSitesList> {
    const metadataList = await this.getGameMetadataList(identifier, ['relatedSites'])
    const candidates = metadataList
      .map(({ dataSource, metadata }) => ({
        dataSource,
        relatedSites: metadata.relatedSites || []
      }))
      .filter((item) => item.relatedSites.length > 0)
    return await Transformer.transformRelatedSitesList(candidates)
  }

  public async getGameInformationList(identifier: ScraperIdentifier): Promise<GameInformationList> {
    try {
      const metadataList = await this.getGameMetadataList(identifier, [
        'name',
        'originalName',
        'releaseDate',
        'developers',
        'publishers',
        'genres',
        'platforms'
      ])
      const candidates = metadataList
        .map(({ dataSource, metadata }) => ({
          dataSource,
          information: {
            name: metadata.name || undefined,
            originalName: metadata.originalName || undefined,
            releaseDate: metadata.releaseDate || undefined,
            developers:
              metadata.developers && metadata.developers.length > 0
                ? metadata.developers
                : undefined,
            publishers:
              metadata.publishers && metadata.publishers.length > 0
                ? metadata.publishers
                : undefined,
            genres: metadata.genres && metadata.genres.length > 0 ? metadata.genres : undefined,
            platforms:
              metadata.platforms && metadata.platforms.length > 0 ? metadata.platforms : undefined
          }
        }))
        .filter((item) => {
          const info = item.information
          return (
            info &&
            (info.name ||
              info.originalName ||
              info.releaseDate ||
              (info.developers && info.developers.length > 0) ||
              (info.publishers && info.publishers.length > 0) ||
              (info.genres && info.genres.length > 0) ||
              (info.platforms && info.platforms.length > 0))
          )
        })

      return await Transformer.transformInformationList(candidates)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'information list')
    }
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager()
