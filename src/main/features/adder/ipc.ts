import {
  addGameToDB,
  getBatchGameAdderData,
  addGameToDBWithoutMetadata,
  updateGameMetadata,
  batchUpdateGameMetadata
} from './services'
import {
  GameMetadataField,
  GameMetadataUpdateMode,
  GameMetadataUpdateOptions
} from '@appTypes/utils'
import { ipcManager } from '~/core/ipc'

export function setupAdderIPC(): void {
  ipcManager.handle(
    'adder:add-game-to-db',
    async (
      _,
      {
        dataSource,
        dataSourceId,
        backgroundUrl,
        dirPath
      }: {
        dataSource: string
        dataSourceId: string
        backgroundUrl?: string
        dirPath?: string
      }
    ) => {
      await addGameToDB({ dataSource, dataSourceId, backgroundUrl, dirPath })
    }
  )

  ipcManager.handle(
    'adder:update-game-metadata',
    async (
      _,
      {
        dbId,
        dataSource,
        dataSourceId,
        fields,
        backgroundUrl,
        options
      }: {
        dbId: string
        dataSource: string
        dataSourceId: string
        fields?: (GameMetadataField | GameMetadataUpdateMode)[]
        backgroundUrl?: string
        options?: GameMetadataUpdateOptions
      }
    ) => {
      await updateGameMetadata({ dbId, dataSource, dataSourceId, fields, backgroundUrl, options })
    }
  )

  ipcManager.handle('adder:get-batch-game-adder-data', async () => {
    return await getBatchGameAdderData()
  })

  ipcManager.handle('adder:add-game-to-db-without-metadata', async (_, gamePath: string) => {
    await addGameToDBWithoutMetadata(gamePath)
  })

  ipcManager.handle(
    'adder:batch-update-game-metadata',
    async (
      _,
      {
        gameIds,
        dataSource,
        fields,
        options,
        concurrency
      }: {
        gameIds: string[]
        dataSource: string
        fields?: (GameMetadataField | GameMetadataUpdateMode)[]
        options?: GameMetadataUpdateOptions
        concurrency?: number
      }
    ) => {
      await batchUpdateGameMetadata({ gameIds, dataSource, fields, options, concurrency })
    }
  )
}
