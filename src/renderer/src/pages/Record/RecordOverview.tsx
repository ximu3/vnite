import { ActivitySquare, Calendar as CalendarIcon, Clock, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, Brush, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { ScrollArea } from '~/components/ui/scroll-area'

import {
  getGamePlayTime,
  getPlayedDaysYearly,
  getTotalPlayedDays,
  getTotalPlayedTimes,
  getTotalplayTime,
  getTotalplayTimeYearly,
  sortGames,
  useGameRegistry
} from '~/stores/game'
import { getPlayTimeDistribution } from '~/stores/game/recordUtils'
import { GameRankingItem } from './GameRankingItem'
import { StatCard } from './StatCard'

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

  const containerRef = useRef<HTMLDivElement>(null)
  const travellerCoordsRef = useRef({ x1: 0, y1: 0, x2: 0, y2: 0 })
  useEffect(() => {
    let observer: MutationObserver

    const updateCoords = (c1: SVGCircleElement, c2: SVGCircleElement): void => {
      travellerCoordsRef.current = {
        x1: parseFloat(c1.getAttribute('cx') || '0') + parseFloat(c1.getAttribute('r') || '0'),
        y1: parseFloat(c1.getAttribute('cy') || '0'),
        x2: parseFloat(c2.getAttribute('cx') || '0') - parseFloat(c2.getAttribute('r') || '0'),
        y2: parseFloat(c2.getAttribute('cy') || '0')
      }
    }

    const initObserver = (): void => {
      const travellers = containerRef.current?.querySelectorAll<SVGCircleElement>(
        '.recharts-brush-traveller circle'
      )

      if (!travellers || travellers.length !== 2) return
      clearInterval(interval)

      const [c1, c2] = travellers
      updateCoords(c1, c2)
      observer = new MutationObserver(() => updateCoords(c1, c2))

      travellers.forEach((c) =>
        observer.observe(c, { attributes: true, attributeFilter: ['cx', 'cy'] })
      )
    }

    const interval = setInterval(initObserver, 50)
    return () => {
      clearInterval(interval)
      observer?.disconnect()
    }
  }, [])

  const lineRef = useRef<SVGLineElement>(null)
  useEffect(() => {
    let frameId: number
    let lastCoords = { x1: 0, y1: 0, x2: 0, y2: 0 }

    const loop = (): void => {
      if (lineRef.current) {
        const { x1, y1, x2, y2 } = travellerCoordsRef.current
        if (
          x1 !== lastCoords.x1 ||
          y1 !== lastCoords.y1 ||
          x2 !== lastCoords.x2 ||
          y2 !== lastCoords.y2
        ) {
          lineRef.current.setAttribute('x1', String(x1))
          lineRef.current.setAttribute('y1', String(y1))
          lineRef.current.setAttribute('x2', String(x2))
          lineRef.current.setAttribute('y2', String(y2))
          lastCoords = { x1, y1, x2, y2 }
        }
      }
      frameId = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Games */}
        <StatCard
          title={t('overview.stats.totalGames')}
          value={`${totalGames} ${t('overview.unit.count')}`}
          icon={<ActivitySquare className="w-4 h-4" />}
        />
        {/* Total Play Time */}
        <StatCard
          title={t('overview.stats.totalPlayTime')}
          value={formatGameTime(totalTime)}
          icon={<Clock className="w-4 h-4" />}
        />
        {/* Total Play Days */}
        <StatCard
          title={t('overview.stats.totalPlayDays')}
          value={`${totalDays} ${t('overview.unit.day')}`}
          icon={<CalendarIcon className="w-4 h-4" />}
        />
        {/* Total Play Times */}
        <StatCard
          title={t('overview.stats.totalPlayTimes')}
          value={`${totalTimes} ${t('overview.unit.times')}`}
          icon={<Trophy className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-4 w-full xl:grid-cols-[1.5fr_1fr]">
        {/* Yearly Play Time Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('overview.chart.yearlyPlayTime')}</CardTitle>
            <CardDescription>{formatGameTime(getTotalplayTimeYearly())}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              ref={containerRef}
              config={yearlyChartConfig}
              className="h-[250px] 3xl:h-[320px] w-full"
              overlay={
                <svg className="w-full h-full">
                  <line ref={lineRef} stroke="var(--primary)" strokeWidth={2} />
                </svg>
              }
            >
              <AreaChart data={yearlyPlayData} margin={{ top: 0, right: 10, bottom: 5, left: 0 }}>
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
                <Brush
                  dataKey="formattedDate"
                  stroke="transparent"
                  fill="transparent"
                  dy={2}
                  height={8}
                  traveller={({ x, y, height }: any) => {
                    const radius = 4
                    return (
                      <circle
                        cx={x + height / 2}
                        cy={y + height / 2}
                        r={radius}
                        fill={'var(--primary)'}
                        fillOpacity={0.3}
                        stroke={'var(--primary)'}
                        strokeWidth={2}
                      />
                    )
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        {/* Yearly Play Time Distribution Chart */}
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
        {/* Yearly Play Time Ranking */}
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
        {/* Yearly Score Ranking */}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('overview.ranking.playTimeRanking')}</DialogTitle>
            <DialogDescription>{t('overview.ranking.allGamesByPlayTime')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="w-[500px] space-y-2">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('overview.ranking.scoreRanking')}</DialogTitle>
            <DialogDescription>{t('overview.ranking.allGamesByScore')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="w-[500px] space-y-2">
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
