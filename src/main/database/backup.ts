import { getDataPath, zipFolder, unzipFile } from '~/utils'
import { app } from 'electron'
import { DBManager } from './common'
import fse from 'fs-extra'
import log from 'electron-log/main'

export async function backupDatabase(targetPath: string, exclude?: string[]): Promise<void> {
  try {
    const dataPath = getDataPath()
    await DBManager.closeAllDatabases()
    await zipFolder(dataPath, targetPath, 'vnite-database', {
      exclude: exclude
    })
    DBManager.init()
  } catch (error) {
    log.error('Error backing up database:', error)
    throw error
  }
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  try {
    const dataPath = getDataPath()
    await DBManager.closeAllDatabases()
    await fse.remove(dataPath)
    await unzipFile(sourcePath, dataPath)
    app.relaunch()
    app.exit()
  } catch (error) {
    log.error('Error restoring database:', error)
    throw error
  }
}
