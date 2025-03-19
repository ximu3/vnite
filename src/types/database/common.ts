import { gameDocs } from './game'
import { configDocs } from './config'

export interface DocChange {
  dbName: string
  docId: string
  data: any
  timestamp: number
}

export interface CouchDBAuth {
  username: string
  password: string
}

export interface DBConfig {
  name: string
  path: string
}

export interface ExcludePath {
  docId?: string | '#all'
  path: string[]
  condition?: (doc: any) => boolean
}

export interface SyncOptions {
  auth?: CouchDBAuth
  isOfficial?: boolean
}

export interface DatabaseSchemas {
  game: gameDocs
  config: configDocs
}

export interface AttachmentChange {
  dbName: string
  docId: string
  attachmentId: string
  timestamp: number
}

export interface SyncStatus {
  status: 'syncing' | 'success' | 'error'
  message: string
  timestamp: string
}

export type AttachmentReturnType<T> = T extends { format: 'file' } ? string : Buffer

export type PathsOf<T> = T extends object
  ? {
      [K in keyof T]: [K] | [K, ...PathsOf<T[K]>]
    }[keyof T]
  : never
