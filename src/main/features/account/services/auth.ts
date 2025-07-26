import { shell, net } from 'electron'
import { jwtDecode } from 'jwt-decode'
import { ConfigDBManager } from '~/core/database'
import { AuthResult, UserRole, AuthentikUser } from '@appTypes/sync'
import log from 'electron-log/main'
import { ipcManager } from '~/core/ipc'

export class AuthManager {
  private static instance: AuthManager | null = null
  private serverUrl!: string
  private clientId!: string
  private clientSecret!: string
  private redirectUrl: string = 'vnite://auth/callback'
  private initialized: boolean = false

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  private static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

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
      log.info('[Account] AuthManager initialized successfully')
    } catch (error) {
      log.error('[Account] AuthManager initialization failed:', error)
      throw error
    }
  }

  private static checkInitialized(): void {
    const instance = AuthManager.getInstance()
    if (!instance.initialized) {
      throw new Error('AuthManager is not initialized correctly, call AuthManager.init() first')
    }
  }

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
      log.error('[Account] Failed to start the registration process:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  public static async startSignin(): Promise<AuthResult> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // Build Authentik Login URL
      const signinUrl = new URL(`${instance.serverUrl}/application/o/authorize/`)
      signinUrl.searchParams.append('client_id', instance.clientId)
      signinUrl.searchParams.append('redirect_uri', instance.redirectUrl)
      signinUrl.searchParams.append('response_type', 'code')
      signinUrl.searchParams.append('scope', 'openid profile email groups couchdb offline_access')

      // Open your default browser to log in
      shell.openExternal(signinUrl.toString())

      return { success: true }
    } catch (error) {
      log.error('[Account] Failure to start the login process:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  public static async refreshAccessToken(): Promise<boolean> {
    try {
      const enabled = await ConfigDBManager.getConfigLocalValue('sync.enabled')
      const mode = await ConfigDBManager.getConfigLocalValue('sync.mode')
      if (mode !== 'official') {
        log.warn('Sync mode is not set to official, skipping access token refresh')
        return false
      }
      if (!enabled) {
        log.warn('Sync is not enabled, skipping access token refresh')
        return false
      }
      AuthManager.checkInitialized()
      const instance = AuthManager.getInstance()

      // Get the stored refresh_token
      const refreshToken = await ConfigDBManager.getConfigLocalValue('userInfo.refreshToken')
      const clientId = instance.clientId
      const clientSecret = instance.clientSecret

      if (!refreshToken) {
        log.error('[Account] No refresh token available')
        return false
      }

      const params = new URLSearchParams()
      params.append('refresh_token', refreshToken)
      params.append('grant_type', 'refresh_token')
      params.append('client_id', clientId)

      const authHeader = clientSecret
        ? `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        : undefined

      // Send a request to refresh the token
      const response = await net.fetch(`${instance.serverUrl}/application/o/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const { access_token, refresh_token } = data

      // Update stored tokens
      const userInfo = (await ConfigDBManager.getConfigLocalValue('userInfo')) || {}
      await ConfigDBManager.setConfigLocalValue('userInfo', {
        ...userInfo,
        accessToken: access_token,
        refreshToken: refresh_token
      })

      return true
    } catch (error) {
      log.error('[Account] Failed to refresh access token:', error)
      return false
    }
  }

  public static reset(): void {
    AuthManager.instance = null
  }

  public static async updateUserInfo(): Promise<void> {
    try {
      AuthManager.checkInitialized()
      const instance = AuthManager.getInstance()

      const accessToken = await ConfigDBManager.getConfigLocalValue('userInfo.accessToken')
      const enabled = await ConfigDBManager.getConfigLocalValue('sync.enabled')

      if (!accessToken || !enabled) {
        return
      }

      const response = await net.fetch(`${instance.serverUrl}/application/o/userinfo/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh the token
          const refreshed = await AuthManager.refreshAccessToken()
          if (refreshed) {
            // Refresh successful, retry with new token
            return AuthManager.updateUserInfo()
          }
        }
        throw new Error(`Failed to get user information: ${response.status} ${response.statusText}`)
      }

      const userInfoData = await response.json()

      if (!userInfoData || !userInfoData.name) {
        throw new Error('Failed to get user information')
      }

      const userRole = AuthManager.getUserRole(userInfoData)

      const oldUserInfo = await ConfigDBManager.getConfigLocalValue('userInfo')
      await ConfigDBManager.setConfigLocalValue('userInfo', {
        ...oldUserInfo,
        name: userInfoData.name,
        email: userInfoData.email,
        role: userRole
      })
    } catch (error) {
      log.error('[Account] Failed to get user information:', error)
      throw error
    }
  }

  public static async handleAuthCode(code: string): Promise<void> {
    AuthManager.checkInitialized()
    const instance = AuthManager.getInstance()

    try {
      // Prepare form data
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: instance.clientId,
        client_secret: instance.clientSecret,
        code: code,
        redirect_uri: instance.redirectUrl
      }).toString()

      // Exchanging authorization codes to obtain access tokens
      const tokenResponse = await net.fetch(`${instance.serverUrl}/application/o/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      })

      if (!tokenResponse.ok) {
        throw new Error(
          `Failed to exchange token: ${tokenResponse.status} ${tokenResponse.statusText}`
        )
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token
      const idToken = tokenData.id_token
      const refreshToken = tokenData.refresh_token

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
        email: userInfo.email || '',
        role: userRole,
        accessToken,
        refreshToken
      })

      // Save CouchDB Credentials
      await ConfigDBManager.setConfigLocalValue('sync.officialConfig', {
        auth: {
          username: couchdbCredentials.username,
          password: couchdbCredentials.password
        }
      })

      // Notify the rendering process of successful authentication
      ipcManager.send('account:auth-success')

      log.info(`[Account] User ${userInfo.name} successfully authenticated`)
      log.info('[Account] User role:', userRole)
    } catch (error) {
      log.error('[Account] Failure to process authorization code:', error)
      ipcManager.send('account:auth-failed', (error as Error).message)
    }
  }

  public static getUserRole(userInfo: AuthentikUser): UserRole {
    // First find the matching role from the user's groups array
    if (userInfo.groups && Array.isArray(userInfo.groups) && userInfo.groups.length > 0) {
      if (userInfo.groups.includes('authentik Admins')) {
        return UserRole.ADMIN
      }
      const roles = ['vnite-developer', 'vnite-premium', 'vnite-community']

      for (const role of roles) {
        if (userInfo.groups.includes(role)) {
          return role.split('-')[1] as UserRole
        }
      }
    }

    // Defaults to Community Edition users
    return UserRole.COMMUNITY
  }
}
