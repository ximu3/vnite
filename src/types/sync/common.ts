export interface CouchDBConfig {
  url: string
  adminUsername: string
  adminPassword: string
}

export interface CouchDBCredentials {
  username: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: string
}

export interface SyncCredentialsResponse {
  success: boolean
  username?: string
  password?: string
  dbName?: string
  couchdbUrl?: string
  error?: string
}

export interface StoredCredentials {
  username: string
  couchdbUsername: string
  couchdbPassword: string
}

export interface AuthCallbackData {
  code: string
  state?: string
}

export interface AuthentikUser {
  sub: string
  name: string
  email: string
  preferred_username: string
  groups: string[]
  role?: string
  avatar?: string
  couchdb?: {
    username: string
    password: string
    url: string
    databases: {
      config: { dbName: string }
      game: { dbName: string }
      gameCollection: { dbName: string }
    }
  }
}
