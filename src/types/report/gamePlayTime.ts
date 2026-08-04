export interface GamePlayTimeReportItem {
  name: string
  playTimeMs: number
  playTimeHours: number
}

export interface GamePlayTimeReport {
  generatedAt: string
  nsfwFilter: 'ALL' | 'SFW' | 'NSFW'
  games: GamePlayTimeReportItem[]
  collections: GamePlayTimeReportItem[]
}
