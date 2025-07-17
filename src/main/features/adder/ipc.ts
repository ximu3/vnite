import {
  addGameToDB,
  getBatchGameAdderData,
  addGameToDBWithoutMetadata,
  updateGameMetadata
} from './services'
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
        backgroundUrl
      }: {
        dbId: string
        dataSource: string
        dataSourceId: string
        backgroundUrl?: string
      }
    ) => {
      await updateGameMetadata({ dbId, dataSource, dataSourceId, backgroundUrl })
    }
  )

  ipcManager.handle('adder:get-batch-game-adder-data', async () => {
    return await getBatchGameAdderData()
  })

  ipcManager.handle('adder:add-game-to-db-without-metadata', async (_, gamePath: string) => {
    await addGameToDBWithoutMetadata(gamePath)
  })
}
