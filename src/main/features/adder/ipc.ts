import {
  GameMetadataField,
  GameMetadataUpdateMode,
  GameMetadataUpdateOptions
} from '@appTypes/utils'
import { ipcManager } from '~/core/ipc'
import {
  addGameToDB,
  addGameToDBWithoutMetadata,
  batchUpdateGameMetadata,
  getBatchGameAdderData,
  updateGameMetadata
} from './services'

export function setupAdderIPC(): void {
  ipcManager.handle(
    'adder:add-game-to-db',
    async (
      _,
      {
        dataSource,
        dataSourceId,
        backgroundUrl,
        upscaleScale,
        dirPath,
        gamePath
      }: {
        dataSource: string
        dataSourceId: string
        backgroundUrl?: string
        upscaleScale?: number
        dirPath?: string
        gamePath?: string
      }
    ) => {
      await addGameToDB({
        dataSource,
        dataSourceId,
        backgroundUrl,
        upscaleScale,
        dirPath,
        gamePath
      })
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
        upscaleScale,
        options
      }: {
        dbId: string
        dataSource: string
        dataSourceId: string
        fields?: (GameMetadataField | GameMetadataUpdateMode)[]
        backgroundUrl?: string
        upscaleScale?: number
        options?: GameMetadataUpdateOptions
      }
    ) => {
      await updateGameMetadata({
        dbId,
        dataSource,
        dataSourceId,
        fields,
        backgroundUrl,
        upscaleScale,
        options
      })
    }
  )

  ipcManager.handle('adder:get-batch-game-adder-data', async () => {
    return await getBatchGameAdderData()
  })

  ipcManager.handle(
    'adder:add-game-to-db-without-metadata',
    async (_, dirPath: string, gamePath: string) => {
      await addGameToDBWithoutMetadata(dirPath, gamePath)
    }
  )

  ipcManager.handle(
    'adder:batch-update-game-metadata',
    async (
      _,
      {
        gameIds,
        dataSource,
        fields,
        upscaleScale,
        options,
        concurrency
      }: {
        gameIds: string[]
        dataSource: string
        fields?: (GameMetadataField | GameMetadataUpdateMode)[]
        upscaleScale?: number
        options?: GameMetadataUpdateOptions
        concurrency?: number
      }
    ) => {
      await batchUpdateGameMetadata({
        gameIds,
        dataSource,
        fields,
        upscaleScale,
        options,
        concurrency
      })
    }
  )
}
