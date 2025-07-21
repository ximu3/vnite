import { zipFolder, unzipFile } from '~/utils'
import { getDataPath } from '~/features/system'
import { app } from 'electron'
import { baseDBManager } from '~/core/database'
import fse from 'fs-extra'
import log from 'electron-log/main'
import { eventBus } from '~/core/events'

export async function backupDatabase(targetPath: string, exclude?: string[]): Promise<void> {
  try {
    const dataPath = getDataPath()
    await baseDBManager.closeAllDatabases()
    await zipFolder(dataPath, targetPath, 'vnite-database', {
      exclude: exclude
    })
    baseDBManager.initAllDatabases()
    eventBus.emit('db:backup-completed', { targetPath }, { source: 'backup-service' })
  } catch (error) {
    log.error('Error backing up database:', error)
    throw error
  }
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  try {
    const dataPath = getDataPath()
    await baseDBManager.closeAllDatabases()
    await fse.remove(dataPath)
    await unzipFile(sourcePath, dataPath)
    eventBus.emit('db:restore-completed', { sourcePath }, { source: 'backup-service' })
    app.relaunch()
    app.exit()
  } catch (error) {
    log.error('Error restoring database:', error)
    throw error
  }
}
