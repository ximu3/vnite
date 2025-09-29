import { IGDBAuthResponse, IGDBAuthConfig } from './types'
import { fetchProxy } from '../../utils/ScraperUtils'

const SCRAPER_ID = 'igdb'

export class IGDBAuthManager {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private tokenExpiration: Date | null = null

  constructor(config: IGDBAuthConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
  }

  // Obtaining a valid access token
  async getValidToken(): Promise<string> {
    // If the token does not exist or has expired, get a new one
    if (!this.accessToken || !this.tokenExpiration || this.isTokenExpired()) {
      await this.refreshToken()
    }
    return this.accessToken!
  }

  // Check for expired tokens
  private isTokenExpired(): boolean {
    if (!this.tokenExpiration) return true
    // Refresh the token 5 minutes early
    const expirationBuffer = 5 * 60 * 1000
    return this.tokenExpiration.getTime() - expirationBuffer < Date.now()
  }

  // Refresh Access Token
  private async refreshToken(): Promise<void> {
    try {
      const response = await fetchProxy(
        SCRAPER_ID,
        'https://id.twitch.tv/oauth2/token?' +
          new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials'
          }),
        {
          method: 'POST'
        }
      )

      if (!response.ok) {
        throw new Error(`authentication failure: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as IGDBAuthResponse

      this.accessToken = data.access_token
      // Calculate token expiration time
      this.tokenExpiration = new Date(Date.now() + data.expires_in * 1000)
    } catch (error) {
      console.error('Failed to get IGDB access token:', error)
      throw error
    }
  }

  // Get request header
  async getHeaders(): Promise<HeadersInit> {
    const token = await this.getValidToken()
    return {
      'Client-ID': this.clientId,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
}

// IGDB API Client
export class IGDBClient {
  private authManager: IGDBAuthManager
  private baseUrl = 'https://api.igdb.com/v4'

  constructor(config: IGDBAuthConfig) {
    this.authManager = new IGDBAuthManager(config)
  }

  // Send API request
  async request<T>(endpoint: string, query: string): Promise<T> {
    try {
      const headers = await this.authManager.getHeaders()
      const response = await fetchProxy(SCRAPER_ID, `${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers,
        body: query
      })

      if (!response.ok) {
        throw new Error(`IGDB API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`IGDB API request failed (${endpoint}):`, error)
      throw error
    }
  }
}
