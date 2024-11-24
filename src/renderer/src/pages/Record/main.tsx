import { cn, formatTimeToChinese, formatDateToChinese } from '~/utils'
import { useGameRecords, useGameIndexManager } from '~/hooks'
import { TimerChart } from '~/components/Game/Record/TimerChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ui/card'
import { ScrollArea } from '@ui/scroll-area'
import { RecordCard } from '~/components/Game/Overview/Record/RecordCard'
import { GamePoster } from './GamePoster'

export function Record({ className }: { className?: string }): JSX.Element {
  const {
    getTotalPlayingTime,
    getPlayedDaysYearly,
    getTotalPlayingTimeYearly,
    getTotalOrdinalNumber,
    gameRecords,
    getTotalPlayedDays,
    getMaxOrdinalGameId
  } = useGameRecords()
  const { sort, gameIndex } = useGameIndexManager()
  const maxScoreGame = sort('score', 'desc').length > 0 ? sort('score', 'desc')[0] : null
  const maxScore = maxScoreGame ? gameIndex.get(maxScoreGame)?.score : 0
  const maxPlayingTimeGame =
    sort('playingTime', 'desc').length > 0 ? sort('playingTime', 'desc')[0] : null
  const maxPlayingTime = maxPlayingTimeGame ? gameIndex.get(maxPlayingTimeGame)?.playingTime : 0
  const maxOrdinalNumberGameId = getMaxOrdinalGameId()
  const maxOrdinalNumber = maxOrdinalNumberGameId
    ? gameRecords[maxOrdinalNumberGameId]?.timer.length
    : 0
  const maxSoonGame = sort('lastRunDate', 'desc').length > 0 ? sort('lastRunDate', 'desc')[0] : null
  const maxSoonDate = maxSoonGame ? gameIndex.get(maxSoonGame)?.lastRunDate : ''
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
              content={`${Object.keys(gameRecords)?.length} 个` || '0 个'}
              className={cn('w-1/4')}
            />
            <RecordCard
              title="总游戏时间"
              content={formatTimeToChinese(getTotalPlayingTime)}
              className={cn('w-1/4')}
            />
            <RecordCard
              title="总游戏天数"
              content={`${getTotalPlayedDays} 天`}
              className={cn('w-1/4')}
            />
            <RecordCard
              title="总游戏次数"
              content={`${getTotalOrdinalNumber} 次` || '0 次'}
              className={cn('w-1/4')}
            />
          </div>
          <div className={cn('flex flex-col gap-3')}>
            <Card className={cn('')}>
              <CardHeader>
                <CardTitle>近一年游戏时间</CardTitle>
                <CardDescription>
                  {formatTimeToChinese(getTotalPlayingTimeYearly())}
                </CardDescription>
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
                    gameId={maxScoreGame}
                    isShowGameName
                    additionalInfo={`${maxScore} 分`}
                    className={cn('w-full')}
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
                    gameId={maxPlayingTimeGame}
                    isShowGameName
                    additionalInfo={formatTimeToChinese(maxPlayingTime as number)}
                    className={cn('w-full')}
                  />
                ) : (
                  '暂无'
                )}
              </CardContent>
            </Card>
            <Card className={cn('w-1/4')}>
              <CardHeader>
                <CardTitle>最多游戏次数</CardTitle>
              </CardHeader>
              <CardContent>
                {maxOrdinalNumberGameId ? (
                  <GamePoster
                    gameId={maxOrdinalNumberGameId}
                    isShowGameName
                    additionalInfo={`${maxOrdinalNumber} 次`}
                    className={cn('w-full')}
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
                    gameId={maxSoonGame}
                    isShowGameName
                    additionalInfo={formatDateToChinese(maxSoonDate as string)}
                    className={cn('w-full')}
                  />
                ) : (
                  '暂无'
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
