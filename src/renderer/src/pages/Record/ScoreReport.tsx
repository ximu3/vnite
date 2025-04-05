import { Badge } from '@ui/badge'
import { Card } from '@ui/card'
import { GameImage } from '@ui/game-image'
import { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardPortal } from '@ui/hover-card'
import { CalendarIcon, ClockIcon, GamepadIcon, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'

import { useGameState } from '~/hooks'
import { getGamePlayTime, getGameStore, useGameRegistry } from '~/stores/game'
import { getGamesByScoreRange } from '~/stores/game/recordUtils'
import { cn } from '~/utils'
import { GamePoster } from './GamePoster'

function GameScoreCard({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('record')
  const { gameMetaIndex } = useGameRegistry()
  const gameInfo = gameMetaIndex[gameId] || { name: t('score.gameInfo.unknown') }
  const [score] = useGameState(gameId, 'record.score')
  const playTime = getGamePlayTime(gameId)

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className={cn('w-[120px] cursor-pointer object-cover', '3xl:w-[150px]')}>
          <div className="relative group">
            <GamePoster
              gameId={gameId}
              className={cn(
                'object-cover rounded-lg shadow-md',
                'w-[120px] h-[180px] cursor-pointer object-cover',
                '3xl:w-[150px] 3xl:h-[225px]'
              )}
            />
            <div className="absolute px-2 py-1 text-xs font-medium rounded-full bottom-2 right-2 bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {score.toFixed(1)}
            </div>
          </div>
          <div className="px-1 mt-2 text-sm font-medium text-center truncate">{gameInfo.name}</div>
        </div>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent className="relative border-0 rounded-lg w-80" side="right">
          <div className="absolute inset-0 rounded-lg">
            <GameImage
              gameId={gameId}
              type="background"
              alt={gameId}
              className="object-cover w-full h-full rounded-lg"
              draggable="false"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-primary/50 to-primary/90 backdrop-blur-xl" />
          </div>
          <div className="relative flex justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-primary-foreground">{gameInfo.name}</h4>
              {gameInfo.genre && (
                <div className="flex items-center pt-2">
                  <GamepadIcon className="mr-2 h-3.5 w-3.5" />
                  <span className="text-xs">{gameInfo.genre}</span>
                </div>
              )}
              {gameInfo.addDate && (
                <div className="flex items-center pt-1">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  <span className="text-xs">
                    {t('score.gameInfo.addDate', { date: new Date(gameInfo.addDate) })}
                  </span>
                </div>
              )}
              <div className="flex items-center pt-1">
                <ClockIcon className="mr-2 h-3.5 w-3.5" />
                <span className="text-xs">{t('score.gameInfo.playTime', { time: playTime })}</span>
              </div>
              {gameInfo.lastRunDate && (
                <div className="flex items-center pt-1">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  <span className="text-xs">
                    {t('score.gameInfo.lastRun', { date: new Date(gameInfo.lastRunDate) })}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <Badge variant="secondary" className="mr-1">
                  {getGamePlayStatus(gameId, t)}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="flex items-center justify-center text-lg font-bold rounded-full shadow-md w-14 h-14 bg-primary text-primary-foreground">
                {score.toFixed(1)}
              </div>
              <span className="mt-1 text-xs text-muted-foreground">
                {t('score.gameInfo.ratingLabel')}
              </span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  )
}

function getGamePlayStatus(gameId: string, t: any): string {
  const gameStore = getGameStore(gameId)
  const status = gameStore.getState().getValue('record.playStatus')

  const statusMap: Record<string, string> = {
    unplayed: t('utils:game.playStatus.unplayed'),
    playing: t('utils:game.playStatus.playing'),
    finished: t('utils:game.playStatus.finished'),
    multiple: t('utils:game.playStatus.multiple'),
    shelved: t('utils:game.playStatus.shelved')
  }

  return statusMap[status] || t('score.playStatus.unknown')
}

// Scoring category components
function ScoreCategory({
  title,
  description,
  minScore,
  maxScore,
  className
}: {
  title: string
  description: string
  minScore: number
  maxScore: number
  className: string
}): JSX.Element | null {
  const { t } = useTranslation('record')
  const games = getGamesByScoreRange(minScore, maxScore)

  if (games.length === 0) {
    return null
  }

  return (
    <Card className={cn(`w-full mb-6 overflow-hidden border-0 shadow-md border-l-4`, className)}>
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
                    <div style={style} className={cn('pt-1', index == 0 && 'pl-1')}>
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

// Main Scoring Report Component
export function ScoreReport(): JSX.Element {
  const { t } = useTranslation('record')

  return (
    <div className="pb-6 space-y-6">
      <div className="flex items-center mb-2 space-x-2">
        <Trophy className="w-5 h-5" />
        <h2 className="text-2xl font-bold">{t('score.title')}</h2>
      </div>

      <p className="mb-6 text-muted-foreground">{t('score.description')}</p>

      <ScoreCategory
        title={t('score.categories.excellent.title')}
        description={t('score.categories.excellent.description')}
        minScore={9}
        maxScore={10}
        className="border-primary"
      />

      <ScoreCategory
        title={t('score.categories.great.title')}
        description={t('score.categories.great.description')}
        minScore={8}
        maxScore={8.9}
        className="border-secondary"
      />

      <ScoreCategory
        title={t('score.categories.good.title')}
        description={t('score.categories.good.description')}
        minScore={7}
        maxScore={7.9}
        className="border-accent"
      />

      <ScoreCategory
        title={t('score.categories.average.title')}
        description={t('score.categories.average.description')}
        minScore={6}
        maxScore={6.9}
        className="border-muted"
      />

      <ScoreCategory
        title={t('score.categories.notRecommended.title')}
        description={t('score.categories.notRecommended.description')}
        minScore={0}
        maxScore={5.9}
        className="border-destructive"
      />
    </div>
  )
}
