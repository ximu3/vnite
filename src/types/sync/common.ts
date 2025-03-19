export interface CasdoorConfig {
  serverUrl: string
  clientId: string
  clientSecret: string
  appName: string
  organizationName: string
  redirectPath?: string
  signinPath?: string
}

export interface CouchDBConfig {
  url: string
  adminUsername: string
  adminPassword: string
}

export interface AuthManagerConfig extends Omit<CasdoorConfig, 'redirectPath'> {
  couchdbConfig: CouchDBConfig
  callbackPort?: number
}

export interface CasdoorUser {
  id?: string
  sub?: string
  name: string
  displayName?: string
  avatar?: string
  email?: string
  phone?: string
  tag?: string
  properties?: Record<string, string>
  [key: string]: any
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

export interface AuthStatusResponse {
  authenticated: boolean
  user?: Omit<CasdoorUser, 'properties'>
  error?: string
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
