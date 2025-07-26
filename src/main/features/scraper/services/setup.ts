import { scraperManager } from './ScraperManager'
import { builtinProviders } from '../providers'
import log from 'electron-log/main.js'

export function setupBuiltinProviders(): void {
  try {
    builtinProviders.forEach((provider) => {
      scraperManager.registerProvider(provider)
      log.info(`[Scraper] Registered built-in scraper provider: ${provider.name} (${provider.id})`)
    })

    log.info(
      `[Scraper] Successfully registered ${builtinProviders.length} built-in scraper providers`
    )
  } catch (error) {
    log.error('[Scraper] Error setting up built-in scraper providers:', error)
  }
}
