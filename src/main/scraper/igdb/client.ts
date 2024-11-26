import { IGDBAuthConfig, IGDBAuthManager } from './auth'

// IGDB API 客户端
class IGDBClient {
  private authManager: IGDBAuthManager
  private baseUrl = 'https://api.igdb.com/v4'

  constructor(config: IGDBAuthConfig) {
    this.authManager = new IGDBAuthManager(config)
  }

  // 发送 API 请求
  async request<T>(endpoint: string, query: string): Promise<T> {
    try {
      const headers = await this.authManager.getHeaders()
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers,
        body: query
      })

      if (!response.ok) {
        throw new Error(`IGDB API 错误: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`IGDB API 请求失败 (${endpoint}):`, error)
      throw error
    }
  }
}

// 创建单例实例
let igdbClient: IGDBClient | null = null

// 初始化 IGDB 客户端
export function initIGDBClient(config: IGDBAuthConfig): IGDBClient {
  if (!igdbClient) {
    igdbClient = new IGDBClient(config)
  }
  return igdbClient
}

// 获取客户端实例
export function getIGDBClient(): IGDBClient {
  if (!igdbClient) {
    throw new Error('IGDB 客户端未初始化')
  }
  return igdbClient
}
