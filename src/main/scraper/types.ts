export type GameList = {
  id: string
  name: string
  releaseDate: string
  developer: string[]
}[]

export type GameMetadata = {
  name: string
  originalName: string | null
  releaseDate: string
  description: string
  developers: string[]
  relatedSites: {
    label: string
    url: string
  }[]
  tags: string[]
}
