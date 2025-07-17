export type SteamGridDBAssets = {
  hero: string
  logo: string
  icon: string
}

export interface SteamGridDBGame {
  id: number
  name: string
  types: string[]
  verified: boolean
}
