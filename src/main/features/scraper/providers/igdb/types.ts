export interface IGDBAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface IGDBAuthConfig {
  clientId: string
  clientSecret: string
}

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
  type: {
    id: number
    type: string
  }
  url: string
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
