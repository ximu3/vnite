import { BatchGameInfo } from '@appTypes/database'

export interface AdderAPI {
  addGameToDb(params: {
    dataSource: string
    dataSourceId: string
    backgroundUrl?: string
    dirPath?: string
  }): Promise<void>
  updateGameMetadata(params: {
    dbId: string
    dataSource: string
    dataSourceId: string
    backgroundUrl?: string
  }): Promise<void>
  getBatchGameAdderData(): Promise<BatchGameInfo[]>
  addGameToDbWithoutMetadata(gamePath: string): Promise<void>
}
