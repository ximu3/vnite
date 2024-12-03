export interface GetOwnedGamesResponse {
  response: {
    game_count: number
    games: Array<{
      appid: number
      name: string
      playtime_2weeks?: number
      playtime_forever: number
    }>
  }
}

export interface FormattedGameInfo {
  appId: number
  name: string
  totalPlayingTime: number
}

// 进度消息的类型定义
export interface ProgressMessage {
  current: number
  total: number
  status: 'started' | 'processing' | 'completed' | 'error'
  message: string
  game?: {
    name: string
    status: 'success' | 'error'
    error?: string
  }
}
