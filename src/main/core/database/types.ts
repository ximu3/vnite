export interface CouchDBAuth {
  username: string
  password: string
}

export interface SyncOptions {
  auth?: CouchDBAuth
  isOfficial?: boolean
}

export type AttachmentReturnType<T> = T extends { format: 'file' } ? string : Buffer
