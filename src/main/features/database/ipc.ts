import { DocChange } from '@appTypes/models'
import { baseDBManager, ConfigDBManager } from '~/core/database'
import { ipcManager } from '~/core/ipc'
import {
  backupDatabase,
  compactRemoteDatabase,
  fullSync,
  getCouchDBSize,
  getGameStorageDetail,
  getLocalStorageReport,
  resetAppearancesSettings,
  restoreDatabase,
  startSync,
  stopSync
} from './services'

export function setupDatabaseIPC(): void {
  ipcManager.handle('db:doc-changed', async (_event, change: DocChange) => {
    return await baseDBManager.setValue(change.dbName, change.docId, '#all', change.data)
  })

  ipcManager.handle('db:get-all-docs', async (_event, dbName: string) => {
    return await baseDBManager.getAllDocs(dbName)
  })

  ipcManager.handle('db:get-local-storage-report', async () => {
    return await getLocalStorageReport()
  })

  ipcManager.handle('db:get-game-storage-detail', async (_, gameId: string) => {
    return await getGameStorageDetail(gameId)
  })

  ipcManager.handle('db:restart-sync', async (_) => {
    await startSync()
  })

  ipcManager.handle('db:full-sync', async (_) => {
    await fullSync()
  })

  ipcManager.handle('db:stop-sync', async (_) => {
    stopSync()
  })

  ipcManager.handle(
    'db:check-attachment',
    async (_event, dbName: string, docId: string, attachmentId: string) => {
      return await baseDBManager.checkAttachment(dbName, docId, attachmentId)
    }
  )

  ipcManager.handle('db:backup', async (_, targetPath: string) => {
    await backupDatabase(targetPath)
  })

  ipcManager.handle('db:restore', async (_, sourcePath: string) => {
    await restoreDatabase(sourcePath)
  })

  ipcManager.handle('db:get-couchdb-size', async (_, refreshCache?: boolean) => {
    const username = await ConfigDBManager.getConfigLocalValue('sync.officialConfig.auth.username')
    return await getCouchDBSize(username, refreshCache)
  })

  ipcManager.handle(
    'db:set-config-background',
    async (_, path: string, theme: 'dark' | 'light') => {
      return await ConfigDBManager.setConfigBackgroundImage(path, theme)
    }
  )

  ipcManager.handle('db:remove-config-background', async (_, theme: 'dark' | 'light' | '#all') => {
    return await ConfigDBManager.removeConfigBackgroundImage(theme)
  })

  ipcManager.handle('db:compact-remote-database', async (_) => {
    const username = await ConfigDBManager.getConfigLocalValue('sync.officialConfig.auth.username')
    await compactRemoteDatabase(username)
  })

  ipcManager.handle('db:reset-appearances-settings', async () => {
    await resetAppearancesSettings()
  })
}
