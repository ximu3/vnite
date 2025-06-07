import { FormattedGameInfo } from '../../main/importer/steam/types'

export interface ImporterAPI {
  importV2Data(dataPath: string): Promise<void>
  getSteamGames(steamId: string): Promise<FormattedGameInfo[]>
  importSelectedSteamGames(games: FormattedGameInfo[]): Promise<number>
}
