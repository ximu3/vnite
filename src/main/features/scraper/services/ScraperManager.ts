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
import { ScraperCapabilities, ScraperProvider } from './types'

const SCRAPER_AGGREGATION_TIMEOUT = 5_000

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

  public async getGameDescriptionList(identifier: ScraperIdentifier): Promise<GameDescriptionList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, description: metadata?.description || '' }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, description: '' }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<{ dataSource: string; description: string }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.description)

      const descriptionList = candidates as GameDescriptionList
      return await Transformer.transformDescriptionList(descriptionList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'description list')
    }
  }

  public async getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, tags: metadata?.tags || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, tags: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<{ dataSource: string; tags: string[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.tags.length > 0)

      const tagsList = candidates as GameTagsList
      return await Transformer.transformTagsList(tagsList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'tags list')
    }
  }

  public async getGameExtraInfoList(identifier: ScraperIdentifier): Promise<GameExtraInfoList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, extra: metadata?.extra || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, extra: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<{ dataSource: string; extra: any[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.extra && item.extra.length > 0)

      const extraInfoList = candidates as GameExtraInfoList
      return await Transformer.transformExtraInfoList(extraInfoList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'extra info list')
    }
  }

  public async getGameDevelopersList(identifier: ScraperIdentifier): Promise<GameDevelopersList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, developers: metadata?.developers || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, developers: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{ dataSource: string; developers: string[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.developers && item.developers.length > 0)

      const developersList = candidates as GameDevelopersList
      return await Transformer.transformDevelopersList(developersList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'developers list')
    }
  }

  public async getGamePublishersList(identifier: ScraperIdentifier): Promise<GamePublishersList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, publishers: metadata?.publishers || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, publishers: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{ dataSource: string; publishers: string[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.publishers && item.publishers.length > 0)

      const publishersList = candidates as GamePublishersList
      return await Transformer.transformPublishersList(publishersList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'publishers list')
    }
  }

  public async getGameGenresList(identifier: ScraperIdentifier): Promise<GameGenresList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, genres: metadata?.genres || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, genres: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<{ dataSource: string; genres: string[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.genres && item.genres.length > 0)

      const genresList = candidates as GameGenresList
      return await Transformer.transformGenresList(genresList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'genres list')
    }
  }

  public async getGamePlatformsList(identifier: ScraperIdentifier): Promise<GamePlatformsList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, platforms: metadata?.platforms || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, platforms: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<{ dataSource: string; platforms: string[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.platforms && item.platforms.length > 0)

      const platformsList = candidates as GamePlatformsList
      return await Transformer.transformPlatformsList(platformsList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'platforms list')
    }
  }

  public async getGameRelatedSitesList(
    identifier: ScraperIdentifier
  ): Promise<GameRelatedSitesList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            return { dataSource: providerId, relatedSites: metadata?.relatedSites || [] }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return { dataSource: providerId, relatedSites: [] }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<{ dataSource: string; relatedSites: any[] }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((item) => item.relatedSites && item.relatedSites.length > 0)

      const relatedSitesList = candidates as GameRelatedSitesList
      return await Transformer.transformRelatedSitesList(relatedSitesList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'related sites list')
    }
  }

  public async getGameInformationList(identifier: ScraperIdentifier): Promise<GameInformationList> {
    try {
      const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])
      // Execute all requests in parallel
      const metadataResults = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          try {
            const metadata = await withAggregationTimeout(
              this.getGameMetadata(providerId, identifier)
            )
            if (metadata === null) {
              return {
                dataSource: providerId,
                information: {}
              }
            }

            return {
              dataSource: providerId,
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
                  metadata.platforms && metadata.platforms.length > 0
                    ? metadata.platforms
                    : undefined
              }
            }
          } catch (error) {
            logScraperError(error, providerId, 'getGameMetadata', 'warn')
            return {
              dataSource: providerId,
              information: {}
            }
          }
        })
      )

      // Extract successful results
      const candidates = metadataResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{
            dataSource: string
            information: any
          }> => result.status === 'fulfilled'
        )
        .map((result) => result.value)
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

      const informationList = candidates as GameInformationList
      return await Transformer.transformInformationList(informationList)
    } catch (error) {
      throw logScraperError(error, 'aggregate', 'information list')
    }
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager()
