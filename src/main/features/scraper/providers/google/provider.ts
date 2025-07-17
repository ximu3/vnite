import { ScraperProvider } from '../../services/types'
import { ScraperIdentifier } from '@appTypes/utils'
import { searchGameImages } from '~/utils'

export const googleProvider: ScraperProvider = {
  id: 'google',
  name: 'Google',

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, 'hero')
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, 'cover')
  },

  async getGameLogos(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, 'logo')
  },

  async getGameIcons(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, 'icon')
  }
}
