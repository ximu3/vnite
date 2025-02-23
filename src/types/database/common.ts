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

interface DBExcludeOptions {
  [dbName: string]: ExcludePath[]
}

export interface SyncOptions {
  excludePaths?: DBExcludeOptions
  auth?: CouchDBAuth
}

export interface DatabaseSchemas {
  game: gameDocs
  config: configDocs
}

export interface AttachmentChange {
  dbName: string
  docId: string
  attachments: string[]
  timestamp: number
}

export interface SyncStatus {
  status: 'syncing' | 'success' | 'error'
  message: string
  timestamp: string
}

export type AttachmentReturnType<T> = T extends { format: 'file' } ? string : Buffer
