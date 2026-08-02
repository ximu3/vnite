export type ReportPresetId = 'posterScoreReport' | 'jsonGamePlayTime'

export type ReportNSFWFilter = 'ALL' | 'SFW' | 'NSFW'

export interface GamePlayTimeReportItem {
  name: string
  playTimeMs: number
  playTimeHours: number
}

export interface GamePlayTimeReport {
  generatedAt: string
  nsfwFilter: ReportNSFWFilter
  games: GamePlayTimeReportItem[]
  collections: GamePlayTimeReportItem[]
}

export interface ReportExportResponse {
  outputFile: string
}
