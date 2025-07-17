import { GameMetadata } from '@appTypes/utils'
import { Transformer } from './services/transformer'
import { ipcManager } from '~/core/ipc'

export function setupTransformerIPC(): void {
  ipcManager.handle(
    'transformer:transform-metadata',
    async (_event, metadata: GameMetadata, transformerIds: string[] | '#all') => {
      return await Transformer.transformMetadata(metadata, transformerIds)
    }
  )

  ipcManager.handle('transformer:export-transformer', async (_event, transformer, targetPath) => {
    await Transformer.exportTransformerToFile(transformer, targetPath)
  })

  ipcManager.handle('transformer:import-transformer', async (_event, sourcePath) => {
    return await Transformer.importTransformerFromFile(sourcePath)
  })

  ipcManager.handle(
    'transformer:transform-all-games',
    async (_event, transformerIds: string[] | '#all') => {
      return await Transformer.transformAllGames(transformerIds)
    }
  )

  ipcManager.handle(
    'transformer:apply-metadata-to-game',
    async (_event, gameId: string, metadata: GameMetadata) => {
      await Transformer.applyMetadataToGame(gameId, metadata)
    }
  )
}
