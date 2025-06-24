import { ipcRenderer } from 'electron'
import type { DocChange } from '../../types/database'

export const databaseAPI = {
  // Database API
  async setValue(change: DocChange): Promise<any> {
    return await ipcRenderer.invoke('db-changed', change)
  },

  async getAllDocs(dbName: string): Promise<any> {
    return await ipcRenderer.invoke('db-get-all-docs', dbName)
  },

  async checkAttachment(dbName: string, docId: string, attachmentId: string): Promise<boolean> {
    return await ipcRenderer.invoke('db-check-attachment', dbName, docId, attachmentId)
  },

  async backupDatabase(targetPath: string): Promise<void> {
    return await ipcRenderer.invoke('backup-database', targetPath)
  },

  async restoreDatabase(sourcePath: string): Promise<void> {
    return await ipcRenderer.invoke('restore-database', sourcePath)
  },

  async getCouchDbSize(): Promise<number> {
    return await ipcRenderer.invoke('get-couchdb-size')
  },
  
  // Sync operations
  async restartSync(): Promise<void> {
    return await ipcRenderer.invoke('restart-sync')
  },

  async stopSync(): Promise<void> {
    return await ipcRenderer.invoke('stop-sync')
  }
}
