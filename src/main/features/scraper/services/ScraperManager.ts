import { ScraperProvider, ScraperCapabilities } from './types'
import {
  GameList,
  GameMetadata,
  ScraperIdentifier,
  GameDescriptionList,
  GameTagsList,
  GameExtraInfoList
} from '@appTypes/utils'
import { Transformer } from '~/features/transformer'

export class ScraperManager {
  private providers: Map<string, ScraperProvider> = new Map()

  /**
   * Register a scraper provider
   * @param provider The scraper provider to register
   */
  public registerProvider(provider: ScraperProvider): void {
    this.providers.set(provider.id, provider)
  }

  /**
   * Unregister a scraper provider
   * @param providerId The ID of the provider to unregister
   */
  public unregisterProvider(providerId: string): void {
    this.providers.delete(providerId)
  }

  /**
   * Get a registered provider by ID
   * @param providerId The ID of the provider
   * @returns The scraper provider or undefined if not found
   */
  public getProvider(providerId: string): ScraperProvider | undefined {
    return this.providers.get(providerId)
  }

  /**
   * Get all registered providers
   * @returns Array of all registered providers
   */
  public getAllProviders(): ScraperProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get all provider IDs
   * @returns Array of all provider IDs
   */
  public getProviderIds(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Check if a provider is registered
   * @param providerId The ID of the provider to check
   * @returns True if provider is registered, false otherwise
   */
  public hasProvider(providerId: string): boolean {
    return this.providers.has(providerId)
  }

  /**
   * Search games using a specific provider
   * @param providerId The ID of the provider to use
   * @param gameName The name of the game to search
   * @returns Promise resolving to game list
   */
  public async searchGames(providerId: string, gameName: string): Promise<GameList> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.searchGames) {
      throw new Error(`Provider '${providerId}' does not support searching games`)
    }
    return provider.searchGames(gameName)
  }

  /**
   * Check if a game exists using a specific provider
   * @param providerId The ID of the provider to use
   * @param identifier The game identifier
   * @returns Promise resolving to boolean
   */
  public async checkGameExists(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<boolean> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.checkGameExists) {
      throw new Error(`Provider '${providerId}' does not support checking game existence`)
    }
    return provider.checkGameExists(identifier)
  }

  /**
   * Get game metadata using a specific provider
   * @param providerId The ID of the provider to use
   * @param identifier The game identifier
   * @returns Promise resolving to game metadata
   */
  public async getGameMetadata(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<GameMetadata> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.getGameMetadata) {
      throw new Error(`Provider '${providerId}' does not support getting game metadata`)
    }
    return provider.getGameMetadata(identifier)
  }

  /**
   * Get game backgrounds using a specific provider
   * @param providerId The ID of the provider to use
   * @param identifier The game identifier
   * @returns Promise resolving to array of background URLs
   */
  public async getGameBackgrounds(
    providerId: string,
    identifier: ScraperIdentifier
  ): Promise<string[]> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.getGameBackgrounds) {
      throw new Error(`Provider '${providerId}' does not support getting game backgrounds`)
    }
    return provider.getGameBackgrounds(identifier)
  }

  /**
   * Get game covers using a specific provider
   * @param providerId The ID of the provider to use
   * @param identifier The game identifier
   * @returns Promise resolving to array of cover URLs
   */
  public async getGameCovers(providerId: string, identifier: ScraperIdentifier): Promise<string[]> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.getGameCovers) {
      throw new Error(`Provider '${providerId}' does not support getting game covers`)
    }
    return provider.getGameCovers(identifier)
  }

  /**
   * Get game logos using a specific provider
   * @param providerId The ID of the provider to use
   * @param identifier The game identifier
   * @returns Promise resolving to array of logo URLs
   */
  public async getGameLogos(providerId: string, identifier: ScraperIdentifier): Promise<string[]> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.getGameLogos) {
      throw new Error(`Provider '${providerId}' does not support getting game logos`)
    }
    return provider.getGameLogos(identifier)
  }

  /**
   * Get game icons using a specific provider
   * @param providerId The ID of the provider to use
   * @param identifier The game identifier
   * @returns Promise resolving to array of icon URLs
   */
  public async getGameIcons(providerId: string, identifier: ScraperIdentifier): Promise<string[]> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }
    if (!provider.getGameIcons) {
      throw new Error(`Provider '${providerId}' does not support getting game icons`)
    }
    return provider.getGameIcons(identifier)
  }

  /**
   * Clear all registered providers
   */
  public clearProviders(): void {
    this.providers.clear()
  }

  /**
   * Get provider Infos that implement specified capabilities
   * @param capabilities Array of capability names that providers must implement
   * @param requireAll If true, providers must implement all capabilities; if false, providers need only implement at least one capability
   * @returns Array of provider Infos that implement the specified capabilities
   */
  public getProviderInfosWithCapabilities(
    capabilities: ScraperCapabilities[],
    requireAll: boolean = true
  ): { id: string; name: string; capabilities: ScraperCapabilities[] }[] {
    return this.getAllProviders()
      .filter((provider) => {
        if (requireAll) {
          return capabilities.every((capability) => {
            return typeof provider[capability] === 'function'
          })
        } else {
          return capabilities.some((capability) => {
            return typeof provider[capability] === 'function'
          })
        }
      })
      .map((provider) => ({
        id: provider.id,
        name: provider.name,
        capabilities: capabilities.filter(
          (capability) => typeof provider[capability] === 'function'
        )
      }))
  }

  private getProviderIdsWithCapabilities(
    capabilities: ScraperCapabilities[],
    requireAll: boolean = true
  ): string[] {
    return this.getAllProviders()
      .filter((provider) => {
        if (requireAll) {
          return capabilities.every((capability) => {
            return typeof provider[capability] === 'function'
          })
        } else {
          return capabilities.some((capability) => {
            return typeof provider[capability] === 'function'
          })
        }
      })
      .map((provider) => provider.id)
  }

  /**
   * Get game description list from multiple providers
   * @param identifier The game identifier
   * @returns Promise resolving to transformed game description list
   */
  public async getGameDescriptionList(identifier: ScraperIdentifier): Promise<GameDescriptionList> {
    const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])

    // Execute all requests in parallel
    const metadataResults = await Promise.allSettled(
      providerIds.map(async (providerId) => {
        try {
          const metadata = await this.getGameMetadata(providerId, identifier)
          return { dataSource: providerId, description: metadata.description || '' }
        } catch {
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
  }

  /**
   * Get game tags list from multiple providers
   * @param identifier The game identifier
   * @returns Promise resolving to transformed game tags list
   */
  public async getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList> {
    const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])

    // Execute all requests in parallel
    const metadataResults = await Promise.allSettled(
      providerIds.map(async (providerId) => {
        try {
          const metadata = await this.getGameMetadata(providerId, identifier)
          return { dataSource: providerId, tags: metadata.tags || [] }
        } catch {
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
  }

  /**
   * Get game extra info list from multiple providers
   * @param identifier The game identifier
   * @returns Promise resolving to transformed game extra info list
   */
  public async getGameExtraInfoList(identifier: ScraperIdentifier): Promise<GameExtraInfoList> {
    const providerIds = this.getProviderIdsWithCapabilities(['getGameMetadata'])

    // Execute all requests in parallel
    const metadataResults = await Promise.allSettled(
      providerIds.map(async (providerId) => {
        try {
          const metadata = await this.getGameMetadata(providerId, identifier)
          return { dataSource: providerId, extra: metadata.extra || [] }
        } catch {
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
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager()
