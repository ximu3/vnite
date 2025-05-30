import { GameMetadata } from '@appTypes/utils'
import { BrowserWindow, ipcMain } from 'electron'
import { Transformer } from '~/database'

export function setupTransformerIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'transform-metadata',
    async (_event, metadata: GameMetadata, transformerIds: string[]) => {
      return await Transformer.transformMetadata(metadata, transformerIds)
    }
  )

  ipcMain.handle('export-transformer', async (_event, transformer, targetPath) => {
    await Transformer.exportTransformerToFile(transformer, targetPath)
  })

  ipcMain.handle('import-transformer', async (_event, sourcePath) => {
    const transformer = await Transformer.importTransformerFromFile(sourcePath)
    return transformer
  })

  ipcMain.handle(
    'transform-game-by-id',
    async (_event, gameId: string, transformerIds: string[]) => {
      return await Transformer.transformGameById(gameId, transformerIds)
    }
  )

  ipcMain.handle('transform-all-games', async (_event, transformerIds: string[]) => {
    return await Transformer.transformAllGames(transformerIds)
  })

  ipcMain.handle('apply-metadata', async (_event, gameId: string, metadata: GameMetadata) => {
    await Transformer.applyMetadataToGame(gameId, metadata)
  })

  mainWindow.webContents.send('transformerIPCReady')
}
