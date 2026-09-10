import { ScraperIdentifier } from '@appTypes/utils'
import { ScraperProvider } from '../../services/types'
import { searchGameImages } from './common'

export const googleProvider: ScraperProvider = {
  id: 'google',
  name: 'Google',

  async getGameWideCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, ['hero', 'header', 'wallpaper'])
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, ['wallpaper', 'CG'])
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, ['cover', 'poster'])
  },

  async getGameLogos(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, 'logo')
  },

  async getGameIcons(identifier: ScraperIdentifier): Promise<string[]> {
    return await searchGameImages(identifier.value, 'icon')
  }
}
