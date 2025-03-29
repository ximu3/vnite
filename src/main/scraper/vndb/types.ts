export interface VNDBRequestParams {
  filters: Array<unknown>
  fields: string | string[]
  results?: number
}

export interface VNDBResponse<T> {
  results: T[]
  more: boolean
  count?: number
}

export interface VNTitle {
  title: string
  main: boolean
  latin?: string
  official: boolean
  lang: string
}

export interface VNDeveloper {
  id: string
  name: string
}

export interface VNTag {
  id: string
  name: string
  rating: number
  spoiler: number
}

export interface VNExtLink {
  id?: string
  label: string
  url: string
}

export interface VNStaff {
  id?: string
  aid: string
  name: string
  role: string
  note?: string
}

export interface VNScreenshot {
  id: string
  url: string
  release_id?: string
  width: number
  height: number
  nsfw: boolean
}

export interface VNImage {
  id: string
  url: string
  width: number
  height: number
}

export interface VNBasicInfo {
  id: string
  titles: VNTitle[]
  released: string
  developers: VNDeveloper[]
}

export interface VNDetailInfo extends VNBasicInfo {
  description: string
  tags: VNTag[]
  extlinks: VNExtLink[]
  staff: VNStaff[]
}

export interface VNWithScreenshots {
  id: string
  screenshots: VNScreenshot[]
}

export interface VNWithCover {
  id: string
  image: VNImage
}

export interface SimpleGameInfo {
  id: string
  name: string
  releaseDate: string
  developers: string[]
}
