import { ipcMain, BrowserWindow } from 'electron'
import { Transformer } from '~/database'
import { GameMetadata } from '@appTypes/utils'

export function setupTransformerIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('transform-metadata', async (_event, metadata: GameMetadata) => {
    return await Transformer.transformMetadata(metadata)
  })

  ipcMain.handle('export-transformer', async (_event, transformer, targetPath) => {
    await Transformer.exportTransformerToFile(transformer, targetPath)
  })

  ipcMain.handle('import-transformer', async (_event, sourcePath) => {
    const transformer = await Transformer.importTransformerFromFile(sourcePath)
    return transformer
  })

  ipcMain.handle('transform-game-by-id', async (_event, gameId: string) => {
    return await Transformer.transformGameById(gameId)
  })

  ipcMain.handle('transform-all-games', async () => {
    return await Transformer.transformAllGames()
  })

  ipcMain.handle('apply-metadata', async (_event, gameId: string, metadata: GameMetadata) => {
    await Transformer.applyMetadataToGame(gameId, metadata)
  })

  mainWindow.webContents.send('transformerIPCReady')
}
