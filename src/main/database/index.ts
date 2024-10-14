export * from './service.js'

export interface DatabaseAPI {
  setDBValue: (dbName: string, path: string[], value: any) => Promise<void>
  getDBValue: (dbName: string, path: string[], defaultValue: any) => Promise<any>
}
