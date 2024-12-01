import fse from 'fs-extra'
import { getDataPath } from '~/utils'
import { setupWatcher, stopWatcher } from '~/watcher'
import { BrowserWindow } from 'electron'

export async function deleteGame(gameId: string): Promise<void> {
  stopWatcher()
  const gameDBPath = await getDataPath(`games/${gameId}/`)
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (gameDBPath) {
    await fse.emptyDir(gameDBPath)
    await fse.remove(gameDBPath)
    mainWindow.webContents.send('record-update')
  }
  await setupWatcher(mainWindow)
  mainWindow.webContents.send('rebuild-index')
}
