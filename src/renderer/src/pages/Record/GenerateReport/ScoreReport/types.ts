export interface ScoreReportExportGame {
  id: string
  name: string
  score: number
  coverSrc: string | null
  coverPosition: string
}

export interface ScoreReportExportCategory {
  id: string
  countLabel: string
  games: ScoreReportExportGame[]
}

export interface ScoreReportExportModel {
  language: string
  title: string
  categories: ScoreReportExportCategory[]
}
