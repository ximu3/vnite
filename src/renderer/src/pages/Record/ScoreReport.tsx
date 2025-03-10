import { Card } from '@ui/card'
import { ScrollArea, ScrollBar } from '@ui/scroll-area'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { Badge } from '@ui/badge'
import { CalendarIcon, ClockIcon, GamepadIcon, Trophy } from 'lucide-react'

import { cn } from '~/utils'
import { GamePoster } from './GamePoster'
import { getGamesByScoreRange, formatChineseDate } from '~/stores/game/recordUtils'
import { useGameRegistry, getGameplayTime, getGameStore } from '~/stores/game'
import { useGameState } from '~/hooks'
import { formatTimeToChinese } from '~/utils'

import { GameImage } from '@ui/game-image'

// 游戏评分卡片组件
function GameScoreCard({ gameId }: { gameId: string }): JSX.Element {
  const { gameMetaIndex } = useGameRegistry()
  const gameInfo = gameMetaIndex[gameId] || { name: '未知游戏' }
  const [score] = useGameState(gameId, 'record.score')
  const playTime = getGameplayTime(gameId)

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className={cn('w-[120px] cursor-pointer object-cover', '3xl:w-[150px]')}>
          <div className="relative group">
            <GamePoster gameId={gameId} className="object-cover rounded-lg shadow-md" />
            <div className="absolute px-2 py-1 text-xs font-medium rounded-full bottom-2 right-2 bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {score.toFixed(1)}
            </div>
          </div>
          <div className="px-1 mt-2 text-sm font-medium text-center truncate">{gameInfo.name}</div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="relative w-80" side="right">
        <div className="absolute inset-0">
          <GameImage
            gameId={gameId}
            type="background"
            alt={gameId}
            className="object-cover w-full h-full"
            draggable="false"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/40 to-accent/80 backdrop-blur-xl" />
        </div>
        <div className="relative flex justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold">{gameInfo.name}</h4>
            {gameInfo.genre && (
              <div className="flex items-center pt-2">
                <GamepadIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{gameInfo.genre}</span>
              </div>
            )}
            {gameInfo.addDate && (
              <div className="flex items-center pt-1">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  添加日期: {formatChineseDate(gameInfo.addDate)}
                </span>
              </div>
            )}
            <div className="flex items-center pt-1">
              <ClockIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                游戏时间: {formatTimeToChinese(playTime)}
              </span>
            </div>
            {gameInfo.lastRunDate && (
              <div className="flex items-center pt-1">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  最近运行: {formatChineseDate(gameInfo.lastRunDate)}
                </span>
              </div>
            )}
            <div className="pt-2">
              <Badge variant="secondary" className="mr-1">
                {getGamePlayStatus(gameId)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="flex items-center justify-center text-lg font-bold rounded-full shadow-md w-14 h-14 bg-primary text-primary-foreground">
              {score.toFixed(1)}
            </div>
            <span className="mt-1 text-xs text-muted-foreground">评分</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// 获取游戏状态的中文描述
function getGamePlayStatus(gameId: string): string {
  const gameStore = getGameStore(gameId)
  const status = gameStore.getState().data?.record.playStatus as string

  const statusMap: Record<string, string> = {
    unplayed: '未玩',
    playing: '游玩中',
    finished: '已通关',
    multiple: '多周目',
    shelved: '已搁置'
  }

  return statusMap[status] || '未知状态'
}

// 评分类别组件
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
            {games.length} 款游戏
          </Badge>
        </div>
        <div className="p-6 pt-0 lg:w-4/5 lg:pt-6">
          <ScrollArea className="w-full">
            <div className="flex px-1 pt-1 pb-4 space-x-5">
              {games.map((gameId) => (
                <GameScoreCard key={gameId} gameId={gameId} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </Card>
  )
}

// 主评分报告组件
export function ScoreReport(): JSX.Element {
  return (
    <div className="pb-3 space-y-6">
      <div className="flex items-center mb-2 space-x-2">
        <Trophy className="w-5 h-5" />
        <h2 className="text-2xl font-bold">游戏评分报告</h2>
      </div>

      <p className="mb-6 text-muted-foreground">
        以下是您的游戏库按评分分类的结果。您可以滑动浏览每个类别中的游戏，并将鼠标悬停在游戏上查看详细信息。
      </p>

      <ScoreCategory
        title="极佳体验 (9-10分)"
        description="这些游戏提供了卓越的体验，强烈推荐"
        minScore={9}
        maxScore={10}
        className="border-primary"
      />

      <ScoreCategory
        title="优秀作品 (8-8.9分)"
        description="这些游戏非常优秀，值得一玩"
        minScore={8}
        maxScore={8.9}
        className="border-secondary"
      />

      <ScoreCategory
        title="良好游戏 (7-7.9分)"
        description="这些游戏有着不错的品质"
        minScore={7}
        maxScore={7.9}
        className="border-accent"
      />

      <ScoreCategory
        title="一般游戏 (6-6.9分)"
        description="这些游戏质量一般，有明显缺点"
        minScore={6}
        maxScore={6.9}
        className="border-muted"
      />

      <ScoreCategory
        title="不推荐 (0-5.9分)"
        description="这些游戏存在严重问题，不推荐体验"
        minScore={0}
        maxScore={5.9}
        className="border-destructive"
      />
    </div>
  )
}
