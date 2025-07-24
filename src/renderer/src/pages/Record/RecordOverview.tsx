import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { ActivitySquare, Calendar as CalendarIcon, Clock, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '~/components/ui/dialog'
import { ScrollArea } from '~/components/ui/scroll-area'

import {
  useGameRegistry,
  getTotalplayTime,
  getTotalPlayedDays,
  getTotalPlayedTimes,
  getTotalplayTimeYearly,
  sortGames,
  getGamePlayTime,
  getPlayedDaysYearly
} from '~/stores/game'
import { StatCard } from './StatCard'
import { GameRankingItem } from './GameRankingItem'
import { getPlayTimeDistribution } from '~/stores/game/recordUtils'

export function RecordOverview(): React.JSX.Element {
  const { t } = useTranslation('record')

  const [showMoreTimeGames, setShowMoreTimeGames] = useState(false)
  const [showMoreScoreGames, setShowMoreScoreGames] = useState(false)

  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const totalGames = Object.keys(gameMetaIndex).length
  const totalTime = getTotalplayTime()
  const totalDays = getTotalPlayedDays()
  const totalTimes = getTotalPlayedTimes()
  const playedDaysYearly = getPlayedDaysYearly()

  // Get all game sorting data, unlimited number of games
  const allTimeGames = sortGames('record.playTime', 'desc').filter(
    (gameId) => getGamePlayTime(gameId) > 0
  )
  const allScoreGames = sortGames('record.score', 'desc').filter(
    (gameId) => gameMetaIndex[gameId].score !== -1
  )

  // Card display only shows the top 5
  const topTimeGames = allTimeGames.slice(0, 5)
  const topScoreGames = allScoreGames.slice(0, 5)

  // Get game time distribution data and make sure it exists 24/7
  const rawTimeDistribution = getPlayTimeDistribution()

  // Ensure that all hourly data exists, even if it is a value of 0
  const timeDistribution = Array.from({ length: 24 }, (_, hour) => {
    const existing = rawTimeDistribution.find((item) => item.hour === hour)
    return existing || { hour, value: 0 }
  }).sort((a, b) => a.hour - b.hour)

  // Add custom label field to timeDistribution for tooltip display
  const enhancedTimeDistribution = timeDistribution.map((item) => ({
    hour: item.hour.toString() + ':00',
    value: item.value,
    timeRange: `${item.hour}:00 - ${(item.hour + 1) % 24}:00`,
    gamingHour: item.value
  }))

  // Get the hottest game slots
  const peakHour = timeDistribution.reduce((max, item) => (item.value > max.value ? item : max), {
    hour: 0,
    value: 0
  })

  // Nearly a year of game time converted to chart data
  const yearlyPlayData = Object.entries(playedDaysYearly)
    .map(([date, playTime]) => ({
      date,
      playTime: Math.round(playTime / 1000 / 60), // Milliseconds to minutes
      formattedDate: date.slice(5) // Only the month-date portion is displayed
    }))
    .sort((a, b) => a.date.localeCompare(b.date)) // Sort by date

  const yearlyChartConfig = {
    playTime: {
      label: t('overview.stats.totalPlayTime'),
      color: 'var(--primary)'
    }
  }

  const distributionChartConfig = {
    gamingHour: {
      label: t('overview.stats.totalPlayTime'),
      color: 'var(--primary)'
    }
  }

  const formatGameTime = (time: number): string => {
    return t('utils:format.gameTime', { time })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('overview.stats.totalGames')}
          value={`${totalGames} ${t('overview.unit.count')}`}
          icon={<ActivitySquare className="w-4 h-4" />}
        />
        <StatCard
          title={t('overview.stats.totalPlayTime')}
          value={formatGameTime(totalTime)}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title={t('overview.stats.totalPlayDays')}
          value={`${totalDays} ${t('overview.unit.day')}`}
          icon={<CalendarIcon className="w-4 h-4" />}
        />
        <StatCard
          title={t('overview.stats.totalPlayTimes')}
          value={`${totalTimes} ${t('overview.unit.times')}`}
          icon={<Trophy className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-4 w-full xl:grid-cols-[1.5fr_1fr]">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('overview.chart.yearlyPlayTime')}</CardTitle>
            <CardDescription>{formatGameTime(getTotalplayTimeYearly())}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={yearlyChartConfig} className="h-[250px] 3xl:h-[320px] w-full">
              <AreaChart data={yearlyPlayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickCount={6}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={(value) => formatGameTime((value as number) * 60000)}
                      hideIndicator={false}
                      color="var(--primary)"
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="playTime"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={0.3}
                  fill="var(--primary)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('overview.chart.timeDistribution')}</CardTitle>
            <CardDescription>
              {t('overview.chart.peakHour', {
                hour: peakHour.hour,
                nextHour: (peakHour.hour + 1) % 24
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={distributionChartConfig}
              className="h-[250px] 3xl:h-[320px] w-full"
            >
              <BarChart data={enhancedTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timeRange"
                  tickFormatter={(hour) => `${hour}`.split(':')[0]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={(value) => formatGameTime((value as number) * 3600000)}
                      hideIndicator={false}
                      nameKey="timeRange"
                      color="var(--primary)"
                    />
                  )}
                />
                <Bar dataKey="gamingHour" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.ranking.playTimeRanking')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topTimeGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={formatGameTime(getGamePlayTime(gameId))}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => setShowMoreTimeGames(true)}>
              {t('overview.ranking.viewMore')}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.ranking.scoreRanking')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topScoreGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={
                    gameMetaIndex[gameId].score?.toFixed(1).toString() || t('overview.misc.noScore')
                  }
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => setShowMoreScoreGames(true)}>
              {t('overview.ranking.viewMore')}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Game Time Ranking - Dialog */}
      <Dialog open={showMoreTimeGames} onOpenChange={setShowMoreTimeGames}>
        <DialogContent className="w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('overview.ranking.playTimeRanking')}</DialogTitle>
            <DialogDescription>{t('overview.ranking.allGamesByPlayTime')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {allTimeGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={formatGameTime(getGamePlayTime(gameId))}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Game Rating Ranking - Dialog */}
      <Dialog open={showMoreScoreGames} onOpenChange={setShowMoreScoreGames}>
        <DialogContent className="w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('overview.ranking.scoreRanking')}</DialogTitle>
            <DialogDescription>{t('overview.ranking.allGamesByScore')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {allScoreGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={
                    gameMetaIndex[gameId].score?.toFixed(1).toString() || t('overview.misc.noScore')
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
