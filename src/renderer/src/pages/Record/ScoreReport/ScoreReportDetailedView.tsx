import { Badge } from '@ui/badge'
import { Card } from '@ui/card'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { GameScoreCard } from './GameScoreCard'
import { ScoreCategoryData, ScoreReportViewProps } from './types'

const lazyVisibilityCallbacks = new WeakMap<Element, (isVisible: boolean) => void>()
let lazyVisibilityObserver: IntersectionObserver | null = null
let observedElementsCount = 0

function getLazyVisibilityObserver(): IntersectionObserver {
  if (!lazyVisibilityObserver) {
    lazyVisibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          lazyVisibilityCallbacks.get(entry.target)?.(entry.isIntersecting)
        })
      },
      {
        rootMargin: '640px 0px'
      }
    )
  }

  return lazyVisibilityObserver
}

function LazyGameScoreCard({ gameId }: { gameId: string }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = getLazyVisibilityObserver()
    lazyVisibilityCallbacks.set(element, setIsVisible)
    observedElementsCount += 1

    observer.observe(element)
    return () => {
      observer.unobserve(element)
      lazyVisibilityCallbacks.delete(element)
      observedElementsCount -= 1

      if (observedElementsCount === 0) {
        observer.disconnect()
        lazyVisibilityObserver = null
      }
    }
  }, [])

  return (
    <div ref={ref} className="h-[212px] w-[120px]">
      {isVisible ? (
        <GameScoreCard gameId={gameId} />
      ) : (
        <div className="h-[180px] w-[120px] rounded-lg bg-muted/40" />
      )}
    </div>
  )
}

function DetailedScoreCategory({
  category
}: {
  category: ScoreCategoryData
}): React.JSX.Element | null {
  const { t } = useTranslation('record')

  if (category.games.length === 0) {
    return null
  }

  return (
    <Card className={cn('overflow-hidden border-0 border-l-4 p-0 shadow-md', category.className)}>
      <div className="border-b bg-muted/30 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{category.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          </div>
          <Badge className="font-normal shrink-0 bg-accent text-accent-foreground">
            {t('score.categories.gamesCount', { count: category.games.length })}
          </Badge>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="grid grid-cols-[repeat(auto-fill,_120px)] justify-between gap-x-6 gap-y-5">
          {category.games.map((gameId) => (
            <LazyGameScoreCard key={gameId} gameId={gameId} />
          ))}
        </div>
      </div>
    </Card>
  )
}

export function ScoreReportDetailedView({ categories }: ScoreReportViewProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <DetailedScoreCategory key={category.id} category={category} />
      ))}
    </div>
  )
}
