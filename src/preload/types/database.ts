import type { DocChange } from '../../types/database'

export interface DatabaseAPI {
  setValue(change: DocChange): Promise<any>
  getAllDocs(dbName: string): Promise<any>
  checkAttachment(dbName: string, docId: string, attachmentId: string): Promise<boolean>
  backupDatabase(targetPath: string): Promise<void>
  restoreDatabase(sourcePath: string): Promise<void>
  getCouchDbSize(): Promise<number>
  setConfigBackground(path: string): Promise<any>
  restartSync(): Promise<void>
  stopSync(): Promise<void>
}
