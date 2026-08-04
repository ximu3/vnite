import type { TFunction } from 'i18next'
import type { GameMetaInfo } from '~/stores/game'
import type { ScoreCategoryData } from './types'

const SCORE_CATEGORIES = [
  { id: 'excellent', minScore: 9, maxScore: 10, className: 'border-primary' },
  { id: 'great', minScore: 8, maxScore: 8.9, className: 'border-secondary' },
  { id: 'good', minScore: 7, maxScore: 7.9, className: 'border-accent' },
  { id: 'average', minScore: 6, maxScore: 6.9, className: 'border-muted' },
  { id: 'notRecommended', minScore: 0, maxScore: 5.9, className: 'border-destructive' }
] as const

export function createScoreReportCategories(
  t: TFunction<'record'>,
  gameIds: readonly string[],
  gameMetaIndex: Record<string, GameMetaInfo>
): ScoreCategoryData[] {
  return SCORE_CATEGORIES.map((category) => {
    const games = gameIds
      .filter((gameId) => {
        const score = gameMetaIndex[gameId]?.score
        return typeof score === 'number' && score >= category.minScore && score <= category.maxScore
      })
      .sort((a, b) => {
        const scoreA = gameMetaIndex[a]?.score ?? -1
        const scoreB = gameMetaIndex[b]?.score ?? -1
        return scoreB - scoreA
      })

    return {
      ...category,
      title: t(`score.categories.${category.id}.title`),
      description: t(`score.categories.${category.id}.description`),
      games
    }
  })
}
