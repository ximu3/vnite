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

  // 获取有效的访问令牌
  async getValidToken(): Promise<string> {
    // 如果令牌不存在或已过期，则获取新令牌
    if (!this.accessToken || !this.tokenExpiration || this.isTokenExpired()) {
      await this.refreshToken()
    }
    return this.accessToken!
  }

  // 检查令牌是否过期
  private isTokenExpired(): boolean {
    if (!this.tokenExpiration) return true
    // 提前5分钟刷新令牌
    const expirationBuffer = 5 * 60 * 1000
    return this.tokenExpiration.getTime() - expirationBuffer < Date.now()
  }

  // 刷新访问令牌
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
      // 计算令牌过期时间
      this.tokenExpiration = new Date(Date.now() + data.expires_in * 1000)
    } catch (error) {
      console.error('获取IGDB访问令牌失败:', error)
      throw error
    }
  }

  // 获取请求头
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
