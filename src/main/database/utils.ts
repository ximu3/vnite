import fse from 'fs-extra'
import { getDataPath } from '~/utils'
import { setupWatcher, stopWatcher } from '~/watcher'
import { BrowserWindow } from 'electron'

export async function deleteGame(gameId: string): Promise<void> {
  const gameDBPath = await getDataPath(`games/${gameId}/`)
  if (gameDBPath) {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    stopWatcher()
    await fse.emptyDir(gameDBPath)
    await fse.remove(gameDBPath)
    await setupWatcher(mainWindow)
    mainWindow.webContents.send('rebuild-index')
    mainWindow.webContents.send('record-update')
  }
}
