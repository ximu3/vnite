import { FormattedGameInfo } from '~/importer/steam/types'

export interface ImporterAPI {
  importV2Data(dataPath: string): Promise<any>
  getSteamGames(steamId: string): Promise<FormattedGameInfo[]>
  importSelectedSteamGames(games: FormattedGameInfo[]): Promise<any>
}
