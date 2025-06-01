import type {
  GameMetadata,
  GameList,
  GameDescriptionList,
  GameTagsList,
  GameExtraInfoList
} from '../../types/utils'
import type { ScraperIdentifier } from '../../types/database'

export interface ScraperAPI {
  searchGames(dataSource: string, gameName: string): Promise<GameList>
  checkGameExists(dataSource: string, gameId: string): Promise<boolean>
  getGameMetadata(dataSource: string, identifier: ScraperIdentifier): Promise<GameMetadata>
  getGameBackgrounds(dataSource: string, identifier: ScraperIdentifier): Promise<string[]>
  getGameCovers(dataSource: string, identifier: ScraperIdentifier): Promise<string[]>
  getGameIcons(dataSource: string, identifier: ScraperIdentifier): Promise<string[]>
  getGameLogos(dataSource: string, identifier: ScraperIdentifier): Promise<string[]>
  getGameDescriptionList(identifier: ScraperIdentifier): Promise<GameDescriptionList>
  getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList>
  getGameExtraInfoList(identifier: ScraperIdentifier): Promise<GameExtraInfoList>
}
