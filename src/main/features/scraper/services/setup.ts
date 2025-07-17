import { scraperManager } from './ScraperManager'
import { builtinProviders } from '../providers'
import log from 'electron-log/main.js'

/**
 * Initialize and register all built-in scraper providers
 */
export function setupBuiltinProviders(): void {
  try {
    builtinProviders.forEach((provider) => {
      scraperManager.registerProvider(provider)
      log.info(`Registered built-in scraper provider: ${provider.name} (${provider.id})`)
    })

    log.info(`Successfully registered ${builtinProviders.length} built-in scraper providers`)
  } catch (error) {
    log.error('Error setting up built-in scraper providers:', error)
  }
}
