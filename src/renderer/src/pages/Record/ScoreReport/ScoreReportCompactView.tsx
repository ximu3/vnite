import { Badge } from '@ui/badge'
import { Card } from '@ui/card'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { cn } from '~/utils'
import { GameScoreCard } from './GameScoreCard'
import { ScoreCategoryData, ScoreReportViewProps } from './types'

interface CompactScoreCategoryProps {
  category: ScoreCategoryData
}

function CompactScoreCategory({ category }: CompactScoreCategoryProps): React.JSX.Element | null {
  const { t } = useTranslation('record')
  const { title, description, games, className } = category

  if (games.length === 0) {
    return null
  }

  return (
    <Card
      className={cn(`w-full mb-6 overflow-hidden border-0 shadow-md border-l-4 p-0`, className)}
    >
      <div className="flex flex-col lg:flex-row">
        <div className="p-6 lg:w-1/5 bg-muted/30">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{description}</p>
          <Badge className="font-normal bg-accent text-accent-foreground">
            {t('score.categories.gamesCount', { count: games.length })}
          </Badge>
        </div>
        <div className="h-[280px] 3xl:h-[325px] p-6 pt-0 lg:w-4/5 lg:pt-6">
          <AutoSizer>
            {({ height, width }) => {
              const itemSize = height <= 250 ? 150 : 180
              return (
                <FixedSizeList
                  height={height}
                  itemCount={games.length}
                  itemSize={itemSize}
                  className={cn('overflow-auto scrollbar-base')}
                  width={width}
                  layout="horizontal"
                >
                  {({ index, style }) => (
                    <div style={style} className={cn('pt-1', index === 0 && 'pl-1')}>
                      <GameScoreCard gameId={games[index]} />
                    </div>
                  )}
                </FixedSizeList>
              )
            }}
          </AutoSizer>
        </div>
      </div>
    </Card>
  )
}

export function ScoreReportCompactView({ categories }: ScoreReportViewProps): React.JSX.Element {
  return (
    <>
      {categories.map((category) => (
        <CompactScoreCategory key={category.id} category={category} />
      ))}
    </>
  )
}
