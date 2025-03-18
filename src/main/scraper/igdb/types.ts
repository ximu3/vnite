export interface IGDBCompany {
  id: number
  name: string
}

export interface IGDBInvolvedCompany {
  id: number
  company: IGDBCompany
  developer: boolean
  publisher: boolean
}

export interface IGDBGenre {
  id: number
  name: string
}

export interface IGDBTheme {
  id: number
  name: string
}

export interface IGDBWebsite {
  id: number
  category: number
  url: string
  trusted: boolean
}

// Search for individual game items in response
export interface IGDBGameBasic {
  id: number
  name: string
  first_release_date?: number
  involved_companies?: IGDBInvolvedCompany[]
}

// Full game details
export interface IGDBGameDetailed extends IGDBGameBasic {
  summary?: string
  genres?: IGDBGenre[]
  themes?: IGDBTheme[]
  websites?: IGDBWebsite[]
}

// API Response Type
export type IGDBSearchResponse = IGDBGameBasic[]
export type IGDBGameResponse = IGDBGameDetailed[]

// Screenshot Response
export interface IGDBScreenshot {
  id: number
  game: number
  height: number
  width: number
  url: string
  image_id: string
}

// Cover Response
export interface IGDBCover {
  id: number
  game: number
  height: number
  width: number
  url: string
  image_id: string
}

export type IGDBScreenshotResponse = IGDBScreenshot[]
export type IGDBCoverResponse = IGDBCover[]

// Enumeration of website categories
export enum IGDBWebsiteCategory {
  OFFICIAL = 1,
  WIKIA = 2,
  WIKIPEDIA = 3,
  FACEBOOK = 4,
  TWITTER = 5,
  TWITCH = 6,
  INSTAGRAM = 8,
  YOUTUBE = 9,
  IPHONE = 10,
  IPAD = 11,
  ANDROID = 12,
  STEAM = 13,
  REDDIT = 14,
  DISCORD = 15,
  GOOGLE_PLUS = 16,
  TUMBLR = 17,
  LINKEDIN = 18,
  PINTEREST = 19,
  SOUNDCLOUD = 20
}
