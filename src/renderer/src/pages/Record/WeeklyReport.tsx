import { generateUUID } from '@appUtils'
import { useRouter, useSearch } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { ScrollArea } from '@ui/scroll-area'
import { Separator } from '@ui/separator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis
} from 'recharts'
import stringWidth from 'string-width'
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'
import { useConfigState } from '~/hooks'
import { getGameStore } from '~/stores/game'
import { getWeeklyPlayData, parseLocalDate } from '~/stores/game/recordUtils'
import { scrollToElement } from '~/utils'
import { MergeIntervalSliderPopover } from './Config/MergeIntervalSliderPopover'
import { GameRankingItem } from './GameRankingItem'

/**
 * Represents a row of data for the timeline chart.
 * The timeline chart is implemented as a stacked bar chart,
 * where the solid-colored bars represent `duration` (actual playtime),
 * and the transparent bars represent `offset` (gaps between play sessions).
 *
 * Therefore, the keys for each bar must not be reused when switching pages,
 * as it may cause rendering order issues.
 */
interface TimeLineRow {
  gameLabel: string
  gameId: string
  color: string
  [key: `offset${number}`]: number // Represents the gap between the end of the previous segment and the start of the current one
  [key: `duration${number}`]: number // Represents the duration of the current segment
  endOffset: number // Ensures a clickable Bar exists at the end of the timeline
  accurateTotal: number // Used to display the precise total duration (merging close segments may introduce slight inaccuracies)
}

function buildTimeLineChartData(
  weekData: ReturnType<typeof getWeeklyPlayData>,
  weekStartTime: number,
  nextWeekStart: Date,
  mergeMaxDurationMin: number // min
): TimeLineRow[] {
  const maxGapMs = mergeMaxDurationMin * 60 * 1000

  const mergeTimers = (
    timers: { start: string; end: string }[]
  ): { timers: { start: number; end: number }[]; accurateTotal: number } => {
    if (!timers || timers.length === 0) return { timers: [], accurateTotal: 0 }

    const sorted = timers
      .map((t) => ({
        start: new Date(t.start).getTime(),
        end: new Date(t.end).getTime()
      }))
      .sort((a, b) => a.start - b.start) // Although it is sorted in upstream...

    const merged: { start: number; end: number }[] = []
    let total = sorted[0].end - sorted[0].start
    let current = { ...sorted[0] }

    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].start - current.end
      total += sorted[i].end - sorted[i].start
      if (gap <= maxGapMs) {
        current.end = Math.max(current.end, sorted[i].end)
      } else {
        merged.push(current)
        current = { ...sorted[i] }
      }
    }
    merged.push(current)
    return { timers: merged, accurateTotal: total }
  }

  return Object.entries(weekData.weeklyPlayTimers).map(([gameId, timers], gameIndex) => {
    const { timers: mergedTimers, accurateTotal } = mergeTimers(timers)
    const gameLabel = getGameStore(gameId).getState().getValue('metadata.name')
    const color = gameIndex % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'

    const row: TimeLineRow = { gameLabel, gameId, color, endOffset: 0, accurateTotal }
    let accumulated = 0

    mergedTimers.forEach((timer, idx) => {
      const startTime = timer.start - weekStartTime
      const endTime = timer.end - weekStartTime
      const duration = endTime - startTime

      const offset = startTime - accumulated
      row[`offset${idx}`] = offset
      row[`duration${idx}`] = duration
      accumulated += offset + duration
    })

    row.endOffset = nextWeekStart.getTime() - weekStartTime - accumulated
    return row
  })
}

export function WeeklyReport(): React.JSX.Element {
  const { t } = useTranslation('record')

  const [showMoreTimeGames, setShowMoreTimeGames] = useState(false)

  const router = useRouter()
  const search = useSearch({ from: '/record' })
  const selectedDate = new Date(search.date)
  const dateTs = selectedDate.getTime()

  const setSelectedDate = (newDate: Date): void => {
    router.navigate({
      to: '/record',
      search: {
        tab: 'weekly',
        date: newDate.toISOString(),
        year: newDate.getFullYear().toString()
      }
    })
  }

  const weekData = useMemo(() => getWeeklyPlayData(selectedDate), [dateTs])

  const goToPreviousWeek = (): void => {
    const prevWeek = new Date(selectedDate)
    prevWeek.setDate(selectedDate.getDate() - 7)
    setSelectedDate(prevWeek)
  }

  const goToNextWeek = (): void => {
    const nextWeek = new Date(selectedDate)
    nextWeek.setDate(selectedDate.getDate() + 7)
    setSelectedDate(nextWeek)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousWeek()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextWeek()
      }
    }

    window.addEventListener('keydown', handleKey, { capture: true })
    return () => window.removeEventListener('keydown', handleKey, { capture: true })
  }, [goToPreviousWeek, goToNextWeek])

  const setLazyloadMark = usePositionButtonStore((state) => state.setLazyloadMark)
  const handleTimeLineClick = (data: any): void => {
    const gameId = data.gameId
    router.navigate({ to: `/library/games/${gameId}/all` })
    setTimeout(() => {
      scrollToElement({
        selector: `[data-game-id="${gameId}"][data-group-id="all"]`
      })
      setTimeout(() => {
        setLazyloadMark(generateUUID())
      }, 100)
    }, 50)
  }

  // Formatting weekly date ranges
  const weekStart = parseLocalDate(weekData.dates[0])
  const weekEnd = parseLocalDate(weekData.dates[weekData.dates.length - 1])
  const nextWeekStart = new Date(weekEnd)
  nextWeekStart.setDate(weekEnd.getDate() + 1)
  const weekRange = t('weekly.dateRange', {
    startDate: weekStart,
    endDate: weekEnd
  })
  const weekStartTime = weekStart.getTime()

  const getLocalizedWeekday = (dayIndex: number): string => {
    const weekdayKeys = [
      'weekly.weekdays.sunday',
      'weekly.weekdays.monday',
      'weekly.weekdays.tuesday',
      'weekly.weekdays.wednesday',
      'weekly.weekdays.thursday',
      'weekly.weekdays.friday',
      'weekly.weekdays.saturday'
    ]
    return t(weekdayKeys[dayIndex])
  }

  // Converting daily game time to graphical data
  const dailyChartData = useMemo(() => {
    return weekData.dates.map((date) => {
      const dayDate = parseLocalDate(date)
      return {
        date,
        weekday: getLocalizedWeekday(dayDate.getDay()),
        playTime: (weekData.dailyPlayTime[date] || 0) / 60000, // Convert to minutes
        fullDate: date
      }
    })
  }, [dateTs])
  const [mergeInterval, setMergeInterval] = useConfigState('record.weekly.mergeInterval')
  const timeLineChartDataFlat = useMemo(() => {
    return buildTimeLineChartData(weekData, weekStartTime, nextWeekStart, mergeInterval)
  }, [dateTs, mergeInterval])

  const handleSliderCommit = useCallback(
    (value: number) => {
      setMergeInterval(value)
    },
    [setMergeInterval]
  )

  const maxTimersCount = Math.max(
    0,
    ...Object.values(weekData.weeklyPlayTimers).map((timers) => timers.length)
  )
  const totalHeight = timeLineChartDataFlat.length * 60 + 40

  const twelveHours = 12 * 60 * 60 * 1000
  const xTicks: number[] = []
  for (let t = 0; t <= nextWeekStart.getTime() - weekStartTime; t += twelveHours) {
    xTicks.push(t)
  }

  const chartConfig = {
    playTime: {
      label: t('overview.stats.totalPlayTime'),
      color: 'var(--primary)'
    }
  }

  const formatGameTime = (time: number): string => {
    return t('utils:format.gameTime', { time })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('weekly.title')}</h2>
        {/* Date Navigation */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">{weekRange}</div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            disabled={new Date(nextWeekStart) > new Date()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Weekly Play Time Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('weekly.dailyPlayTime')}</CardTitle>
            <CardDescription>
              {t('weekly.totalWeeklyTime', { time: weekData.totalTime })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="weekday" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={(value) => formatGameTime((value as number) * 60000)}
                      labelFormatter={(weekday, data) => {
                        if (data && data[0]?.payload) {
                          const rawDate = parseLocalDate(data[0].payload.fullDate)
                          return `${weekday} (${t('utils:format.niceDate', { date: rawDate })})`
                        }
                        return weekday
                      }}
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
        {/* Weekly Play Time Line Chart */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row">
            <CardTitle>{t('weekly.playTimeLine.title')}</CardTitle>
            <MergeIntervalSliderPopover
              title={t('weekly.playTimeLine.mergeMaxInterval')}
              initialValue={mergeInterval}
              min={0}
              max={120}
              step={5}
              onCommit={handleSliderCommit}
            />
          </CardHeader>
          <CardContent className="pt-0">
            {Object.keys(weekData.weeklyPlayTimers).length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t('weekly.playTimeLine.noRecords')}
              </div>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="w-full"
                style={{ height: `${totalHeight}px` }}
              >
                <BarChart data={timeLineChartDataFlat} layout="vertical">
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    ticks={xTicks}
                    tickFormatter={(t) => {
                      const date = new Date(t + weekStartTime)
                      const hours = String(date.getHours()).padStart(2, '0')
                      const minutes = String(date.getMinutes()).padStart(2, '0')

                      if (hours === '00' && minutes === '00') {
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        return `${month}-${day}`
                      } else {
                        return `${hours}:${minutes}`
                      }
                    }}
                    orientation="top"
                  />
                  <YAxis
                    type="category"
                    dataKey="gameLabel"
                    tickLine={false}
                    axisLine={false}
                    width="auto"
                    tickFormatter={(text) => {
                      const maxSegmentWidth = 25
                      const segments = String(text).split(/\s+/)

                      for (let i = 0; i < segments.length; i++) {
                        const seg = segments[i]

                        if (stringWidth(seg) > maxSegmentWidth) {
                          let acc = 0
                          let cutIndex = 0

                          for (const ch of seg) {
                            const w = stringWidth(ch)
                            if (acc + w > maxSegmentWidth) break
                            acc += w
                            cutIndex += ch.length
                          }

                          segments[i] = seg.slice(0, cutIndex) + '…'
                          return segments.slice(0, i + 1).join(' ')
                        }
                      }

                      return segments.join(' ')
                    }}
                  />
                  {xTicks.map((t, idx) => (
                    <ReferenceLine
                      key={t}
                      x={t}
                      stroke={'var(--muted-foreground)'}
                      strokeOpacity={idx % 2 === 0 ? 0.6 : 0.25}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                  ))}
                  <ChartTooltip
                    content={(props) => (
                      <ChartTooltipContent
                        {...props}
                        blockFormatter
                        labelFormatter={(label, data) => {
                          if (!data || data.length === 0) return label

                          const row: TimeLineRow = data[0].payload
                          const gameName = row.gameLabel
                          const totalTime = row.accurateTotal

                          return `${gameName}\n${formatGameTime(totalTime)} (${((totalTime / weekData.totalTime) * 100).toFixed(2)}%)`
                        }}
                        labelClassName="leading-loose"
                        hideIndicator={false}
                        color="var(--primary)"
                      />
                    )}
                  />
                  {Array.from({ length: maxTimersCount }).map((_, idx) => (
                    <Fragment key={`${search.date}-${idx}`}>
                      <Bar
                        key={`${search.date}-offset${idx}`}
                        dataKey={`offset${idx}`}
                        stackId={'a'}
                        fill="transparent"
                        onClick={handleTimeLineClick}
                        cursor="pointer"
                      />
                      <Bar
                        key={`${search.date}-duration${idx}`}
                        dataKey={`duration${idx}`}
                        stackId={'a'}
                        radius={2}
                        fill={'var(--primary)'}
                        onClick={handleTimeLineClick}
                        cursor="pointer"
                      >
                        {timeLineChartDataFlat.map((row) => (
                          <Cell key={row.gameId} fill={row.color} />
                        ))}
                      </Bar>
                    </Fragment>
                  ))}
                  {/* In order to make the end area also clickable */}
                  <Bar
                    key={`${search.date}-endOffset`}
                    dataKey={`endOffset`}
                    stackId={'a'}
                    radius={2}
                    fill="transparent"
                    onClick={handleTimeLineClick}
                    cursor="pointer"
                  ></Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        {/* Weekly Highlights Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('weekly.highlights.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekData.mostPlayedDay ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('weekly.highlights.longestDay')}
                  </p>
                  <p className="text-lg font-bold">
                    {t('weekly.highlights.dateFormat', {
                      weekday: getLocalizedWeekday(
                        parseLocalDate(weekData.mostPlayedDay.date).getDay()
                      ),
                      date: parseLocalDate(weekData.mostPlayedDay.date)
                    })}
                  </p>
                  <p className="text-sm">
                    {t('weekly.highlights.playTime', { time: weekData.mostPlayedDay.playTime })}
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('weekly.highlights.noRecords')}
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">{t('weekly.highlights.frequency')}</p>
                <p className="text-lg font-bold">
                  {t('weekly.highlights.daysPlayed', {
                    played: Object.values(weekData.dailyPlayTime).filter((time) => time > 0).length,
                    total: Object.keys(weekData.dailyPlayTime).length
                  })}
                </p>
                <p className="text-sm">
                  {t('weekly.highlights.percentage', {
                    percent: Math.round(
                      (Object.values(weekData.dailyPlayTime).filter((time) => time > 0).length /
                        Object.keys(weekData.dailyPlayTime).length) *
                        100
                    )
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Weekly Game Rankings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('weekly.weeklyGames.title')}</CardTitle>
            {weekData.mostPlayedGames.length > 3 && (
              <Button variant="ghost" size="icon" onClick={() => setShowMoreTimeGames(true)}>
                <span className="icon-[mdi--chevron-double-right] w-5 h-5"></span>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekData.mostPlayedGames.length > 0 ? (
                weekData.mostPlayedGames
                  .slice(0, 3)
                  .map((game, index) => (
                    <GameRankingItem
                      key={game.gameId}
                      gameId={game.gameId}
                      rank={index + 1}
                      extraInfo={formatGameTime(game.playTime)}
                    />
                  ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('weekly.weeklyGames.noRecords')}
                </div>
              )}
            </div>
          </CardContent>
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
              {weekData.mostPlayedGames.map(({ gameId, playTime }, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={formatGameTime(playTime)}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
