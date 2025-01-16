import { getDataPath, zipFolder, unzipFile } from '~/utils'
import { stopWatcher, setupWatcher } from '~/watcher'
import { BrowserWindow, app } from 'electron'

export async function backupDatabase(targetPath: string): Promise<void> {
  stopWatcher()
  const dataPath = await getDataPath('')
  await zipFolder(dataPath, targetPath, 'vnite-database', {
    exclude: ['path.json']
  })
  const mainWindow = BrowserWindow.getAllWindows()[0]
  setupWatcher(mainWindow)
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  stopWatcher()
  const dataPath = await getDataPath('')
  await unzipFile(sourcePath, dataPath)
  const mainWindow = BrowserWindow.getAllWindows()[0]
  setupWatcher(mainWindow)
  app.relaunch()
  app.exit()
}
