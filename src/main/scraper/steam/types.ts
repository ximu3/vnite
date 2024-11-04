// Steam API 响应类型定义
export type SteamSearchResponse = {
  appid: number
  name: string
}

type SteamAppDetailsData = {
  name: string
  detailed_description: string
  short_description: string
  about_the_game: string
  release_date: {
    date: string
  }
  developers: string[]
  publishers: string[] // 发行商
  genres: Array<{
    // 游戏类型
    id: string
    description: string
  }>
  categories: Array<{
    // 游戏分类
    id: number
    description: string
  }>
  screenshots: Array<{
    path_full: string
  }>
  header_image: string
  website: string
  metacritic?: {
    score: number
    url: string
  }
}

export type SteamAppDetailsResponse = {
  [key: string]: {
    success: boolean
    data: SteamAppDetailsData
  }
}
