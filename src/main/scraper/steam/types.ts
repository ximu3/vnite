export interface SteamStoreSearchResponse {
  items: {
    id: number
    name: string
    tiny_image: string
    price?: {
      final: number
      initial: number
      discount_percent: number
    }
  }[]
  total: number
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
