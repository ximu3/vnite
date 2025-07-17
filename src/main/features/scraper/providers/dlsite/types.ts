export interface DLsiteSearchResult {
  id: string
  name: string
  releaseDate: string
  developer: string
}

export interface DLsiteWorkInfo {
  id: string
  name: string
  originalName: string
  releaseDate: string
  description: string
  developer: string
  genres: string[]
  tags: string[]
  relatedSites: Array<{
    label: string
    url: string
  }>
}

export interface DLsiteLanguageConfig {
  locale: string
  workType: string
  releaseDate: string
  series: string
  maker: string
}
