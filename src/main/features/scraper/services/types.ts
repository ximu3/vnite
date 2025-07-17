import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
export type { ScraperCapabilities } from '@appTypes/utils'

export interface ScraperProvider {
  id: string
  name: string

  searchGames?(gameName: string): Promise<GameList>
  checkGameExists?(identifier: ScraperIdentifier): Promise<boolean>
  getGameMetadata?(identifier: ScraperIdentifier): Promise<GameMetadata>
  getGameBackgrounds?(identifier: ScraperIdentifier): Promise<string[]>
  getGameCovers?(identifier: ScraperIdentifier): Promise<string[]>
  getGameLogos?(identifier: ScraperIdentifier): Promise<string[]>
  getGameIcons?(identifier: ScraperIdentifier): Promise<string[]>
}
