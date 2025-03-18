import { BrowserWindow, shell } from 'electron'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

import { ConfigDBManager } from '~/database'
import { AuthResult, UserRole } from '@appTypes/sync'
import { startSync } from '~/database'
import log from 'electron-log/main'

// Authentik User Interface
interface AuthentikUser {
  sub: string
  name: string
  email: string
  preferred_username: string
  groups: string[]
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

export class AuthManager {
  private static instance: AuthManager | null = null
  private serverUrl!: string
  private clientId!: string
  private clientSecret!: string
  private redirectUrl: string = 'vnite://auth/callback'
  private initialized: boolean = false

  // Private constructor to prevent direct instance creation
  private constructor() {
    // Constructor is empty
  }

  /**
   * Getting a singleton instance (internal use)
   */
  private static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Initializing the Singleton Configuration
   */
  public static init(): void {
    const instance = AuthManager.getInstance()
    if (instance.initialized) {
      return
    }

    // Load configuration from environment variables
    try {
      // Getting the necessary configuration
      instance.serverUrl = import.meta.env.VITE_AUTHENTIK_SERVER_URL || ''
      instance.clientId = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || ''
      instance.clientSecret = import.meta.env.VITE_AUTHENTIK_CLIENT_SECRET || ''

      // Verify the necessary configuration items
      if (!instance.serverUrl || !instance.clientId || !instance.clientSecret) {
        throw new Error('Missing required Authentik configurations')
      }

      instance.initialized = true
      log.info('AuthManager initialized successfully')
    } catch (error) {
      log.error('AuthManager initialization failed:', error)
      throw error
    }
  }

  /**
   * Check if the instance is initialized
   */
  private static checkInitialized(): void {
    const instance = AuthManager.getInstance()
    if (!instance.initialized) {
      throw new Error('AuthManager is not initialized correctly, call AuthManager.init() first')
    }
  }

  /**
   * Initiate the registration process
   */
  public static async startSignup(): Promise<AuthResult> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // Build Authentik Registration URL
      const signupUrl = new URL(`${instance.serverUrl}/if/flow/vnite-enrollment/`)
      signupUrl.searchParams.append('client_id', instance.clientId)
      signupUrl.searchParams.append('redirect_uri', instance.redirectUrl)

      // Open the default browser to register
      shell.openExternal(signupUrl.toString())

      return { success: true }
    } catch (error) {
      log.error('Failed to start the registration process:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * Starting the login process
   */
  public static async startSignin(): Promise<AuthResult> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // Build Authentik Login URL
      const signinUrl = new URL(`${instance.serverUrl}/application/o/authorize/`)
      signinUrl.searchParams.append('client_id', instance.clientId)
      signinUrl.searchParams.append('redirect_uri', instance.redirectUrl)
      signinUrl.searchParams.append('response_type', 'code')
      signinUrl.searchParams.append('scope', 'openid profile email groups couchdb')

      // Open your default browser to log in
      shell.openExternal(signinUrl.toString())

      return { success: true }
    } catch (error) {
      log.error('Failure to start the login process:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * Reset singletons (mainly for testing and development)
   */
  public static reset(): void {
    AuthManager.instance = null
  }

  /**
   * Handling authorization codes - public method, called by the master process
   */
  public static async handleAuthCode(code: string, mainWindow: BrowserWindow): Promise<void> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // Exchanging authorization codes to obtain access tokens
      const tokenResponse = await axios.post(
        `${instance.serverUrl}/application/o/token/`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: instance.clientId,
          client_secret: instance.clientSecret,
          code: code,
          redirect_uri: instance.redirectUrl
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      const accessToken = tokenResponse.data.access_token
      const idToken = tokenResponse.data.id_token

      // Parsing ID tokens for basic user information
      const userInfo = jwtDecode(idToken) as AuthentikUser

      // Getting CouchDB Credentials
      const couchdbCredentials = userInfo.couchdb
        ? {
            username: userInfo.couchdb.username,
            password: userInfo.couchdb.password
          }
        : null

      // If there are no CouchDB credentials, an error is reported
      if (!couchdbCredentials) {
        throw new Error(
          'Unable to get CouchDB credentials, make sure Authentik is properly configured'
        )
      }

      const userRole = AuthManager.getUserRole(userInfo)

      // Save user credentials
      await ConfigDBManager.setConfigLocalValue('userInfo', {
        name: userInfo.name || '',
        accessToken,
        role: userRole
      })

      // Save CouchDB Credentials
      await ConfigDBManager.setConfigLocalValue('sync.officialConfig', {
        auth: {
          username: couchdbCredentials.username,
          password: couchdbCredentials.password
        }
      })

      // Notify the rendering process of successful authentication
      mainWindow.webContents.send('auth-success')

      // Initiate synchronization
      await startSync()
    } catch (error) {
      log.error('处理授权码失败:', error)
      mainWindow.webContents.send('auth-error', (error as Error).message)
    }
  }

  /**
   * Get user roles
   */
  private static getUserRole(userInfo: AuthentikUser): UserRole {
    // First find the matching role from the user's groups array
    if (userInfo.groups && Array.isArray(userInfo.groups) && userInfo.groups.length > 0) {
      // Get all roles for a user and sort them by priority (Admin > Community Edition)
      if (userInfo.groups.includes('authentik-admins') || userInfo.groups.includes('admin')) {
        return UserRole.ADMIN
      } else if (userInfo.groups.includes('community')) {
        return UserRole.COMMUNITY
      }
    }

    // Defaults to Community Edition users
    return UserRole.COMMUNITY
  }
}

/**
 * Handling Authorization Callback URLs
 */
export function handleAuthCallback(url: string): void {
  if (!url.startsWith('vnite://auth/callback')) return

  try {
    // Parsing the URL and getting the authorization code
    const urlObj = new URL(url)
    const code = urlObj.searchParams.get('code')

    // Get Main Window
    const mainWindow = BrowserWindow.getAllWindows()[0]

    if (code && mainWindow) {
      // Pass the authorization code to AuthManager for processing
      AuthManager.handleAuthCode(code, mainWindow)
    } else {
      log.error('Authorization code not found in authorization callback')
    }
  } catch (error) {
    log.error('Failure to process authorization callback URL:', error)
  }
}
