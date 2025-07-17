// Individual game entries in the game list
interface GameListItem {
  id: number
  name: string
  chineseName?: string
  releaseDate?: string
  orgName?: string // Developer Name
  mainImg?: string // main picture
}

// Game List Response Type
export interface GameListResponse {
  result: GameListItem[]
}

// Game Details
interface GameDetail {
  name: string
  chineseName?: string
  releaseDate?: string
  introduction?: string
  developerId?: number
  mainImg?: string
  website?: { title: string; link: string }[]
  tags?: string[]
  staff?: {
    sid: number
    pid: number
    jobName: string
    desc: string
    empName: string
  }[]
}

// Game Details Response Type
export interface GameDetailResponse {
  game: GameDetail
}

// Developer Organization Details Interface
export interface Organization {
  orgId: number
  name: string
  chineseName?: string
  introduction?: string
  website?: { title: string; link: string }[]
  country?: string
  type: string
}

export interface OrganizationResponse {
  org: Organization
}

// Defining API Response Types
export interface YMGalResponse<T> {
  success: boolean
  code: number
  msg?: string
  data: T
}

// Define the Token response type
export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}
