// auth.ts
export interface IGDBAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface IGDBAuthConfig {
  clientId: string
  clientSecret: string
}

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
      const response = await fetch(
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
        throw new Error(`认证失败: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as IGDBAuthResponse

      this.accessToken = data.access_token
      // Calculate token expiration time
      this.tokenExpiration = new Date(Date.now() + data.expires_in * 1000)
    } catch (error) {
      console.error('获取IGDB访问令牌失败:', error)
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
