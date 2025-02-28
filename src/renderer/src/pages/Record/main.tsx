import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { ScrollArea } from '@ui/scroll-area'
import { RecordCard } from '~/components/Game/Overview/Record/RecordCard'
import { TimerChart } from '~/components/Game/Record/TimerChart'
import {
  getTotalplayTime,
  getPlayedDaysYearly,
  getTotalplayTimeYearly,
  getTotalPlayedDays,
  sortGames,
  useGameRegistry
} from '~/stores/game'
import { cn, formatDateToChinese, formatTimeToChinese } from '~/utils'
import { GamePoster } from './GamePoster'
import { PlayedTimesRank } from './PlayedTimesRank'
import { PlayingTimeRank } from './PlayingTimeRank'
import { ScoreRank } from './ScoreRank'

export function Record({ className }: { className?: string }): JSX.Element {
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const maxScoreGame =
    sortGames('record.score', 'desc').length > 0 ? sortGames('record.score', 'desc')[0] : null
  const maxScore = maxScoreGame ? gameMetaIndex[maxScoreGame]?.name : 0
  const maxPlayingTimeGame =
    sortGames('record.playTime', 'desc').length > 0 ? sortGames('record.playTime', 'desc')[0] : null
  const maxPlayingTime = maxPlayingTimeGame ? gameMetaIndex[maxPlayingTimeGame]?.name : 0
  const maxSoonGame =
    sortGames('record.lastRunDate', 'desc').length > 0
      ? sortGames('record.lastRunDate', 'desc')[0]
      : null
  const maxSoonDate = maxSoonGame ? gameMetaIndex[maxSoonGame]?.name : ''
  const playedDaysYearly = getPlayedDaysYearly()
  return (
    <div
      className={cn(
        'w-full h-[100vh] bg-background border-l-[1px] border-border pt-[34px]',
        className
      )}
    >
      <ScrollArea className={cn('w-full h-full p-6 pt-0')}>
        <div className={cn('flex flex-col gap-6')}>
          <div className={cn('text-2xl font-bold')}>我的游戏记录</div>
          <div className={cn('flex flex-row gap-3')}>
            <RecordCard
              title="总游戏数"
              content={`${Object.keys(gameMetaIndex).length} 个`}
              className={cn('w-1/4')}
            />
            <RecordCard
              title="总游戏时间"
              content={formatTimeToChinese(getTotalplayTime())}
              className={cn('w-1/4')}
            />
            <RecordCard
              title="总游戏天数"
              content={`${getTotalPlayedDays()} 天`}
              className={cn('w-1/4')}
            />
          </div>
          <div className={cn('flex flex-col gap-3')}>
            <Card className={cn('')}>
              <CardHeader>
                <CardTitle>近一年游戏时间</CardTitle>
                <CardDescription>{formatTimeToChinese(getTotalplayTimeYearly())}</CardDescription>
              </CardHeader>
              <CardContent>
                <TimerChart
                  data={playedDaysYearly}
                  className={cn('w-full h-[250px] -ml-5', '3xl:h-[400px]')}
                />
              </CardContent>
            </Card>
          </div>
          <div className={cn('flex flex-row gap-3')}>
            <Card className={cn('w-1/4')}>
              <CardHeader>
                <CardTitle>最高评分</CardTitle>
              </CardHeader>
              <CardContent>
                {maxScoreGame ? (
                  <GamePoster
                    fontStyles={{
                      name: 'w-[90%] text-center break-words whitespace-normal max-h-[50%] overflow-hidden',
                      additionalInfo: ''
                    }}
                    gameId={maxScoreGame}
                    isShowGameName
                    additionalInfo={maxScore == '' ? '暂无评分' : `${maxScore} 分`}
                    className={cn('w-full aspect-[0.667]')}
                  />
                ) : (
                  '暂无'
                )}
              </CardContent>
            </Card>
            <Card className={cn('w-1/4')}>
              <CardHeader>
                <CardTitle>最长游戏时间</CardTitle>
              </CardHeader>
              <CardContent>
                {maxPlayingTimeGame ? (
                  <GamePoster
                    fontStyles={{
                      name: 'w-[90%] text-center break-words whitespace-normal max-h-[50%] overflow-hidden',
                      additionalInfo: ''
                    }}
                    gameId={maxPlayingTimeGame}
                    isShowGameName
                    additionalInfo={maxPlayingTime == 0 ? '从未游玩' : ''}
                    className={cn('w-full aspect-[0.667]')}
                  />
                ) : (
                  '暂无'
                )}
              </CardContent>
            </Card>
            <Card className={cn('w-1/4')}>
              <CardHeader>
                <CardTitle>最近运行游戏</CardTitle>
              </CardHeader>
              <CardContent>
                {maxSoonGame ? (
                  <GamePoster
                    fontStyles={{
                      name: 'w-[90%] text-center break-words whitespace-normal max-h-[50%] overflow-hidden',
                      additionalInfo: ''
                    }}
                    gameId={maxSoonGame}
                    isShowGameName
                    additionalInfo={
                      maxSoonDate ? formatDateToChinese(maxSoonDate as string) : '从未运行'
                    }
                    className={cn('w-full aspect-[0.667]')}
                  />
                ) : (
                  '暂无'
                )}
              </CardContent>
            </Card>
          </div>
          <div className={cn('flex flex-row gap-3 h-[500px]', '3xl:h-[600px]')}>
            <Card className={cn('w-1/3')}>
              <CardHeader>
                <CardTitle>评分排行</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreRank className={cn('h-[400px]', '3xl:h-[500px]')} />
              </CardContent>
            </Card>
            <Card className={cn('w-1/3')}>
              <CardHeader>
                <CardTitle>时间排行</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayingTimeRank className={cn('h-[400px]', '3xl:h-[500px]')} />
              </CardContent>
            </Card>
            <Card className={cn('w-1/3')}>
              <CardHeader>
                <CardTitle>次数排行</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayedTimesRank className={cn('h-[400px]', '3xl:h-[500px]')} />
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
