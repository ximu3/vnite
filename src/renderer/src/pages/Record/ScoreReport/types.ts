export type ScoreReportView = 'compact' | 'detailed'

export interface ScoreCategoryData {
  id: string
  title: string
  description: string
  minScore: number
  maxScore: number
  className: string
  games: string[]
}

export interface ScoreReportViewProps {
  categories: ScoreCategoryData[]
}
