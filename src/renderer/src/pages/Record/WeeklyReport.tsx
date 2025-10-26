import { generateUUID } from '@appUtils'
import { useRouter, useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Fragment, useEffect } from 'react'
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
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import { Separator } from '~/components/ui/separator'
import { getGameStore } from '~/stores/game'
import { getWeeklyPlayData, parseLocalDate } from '~/stores/game/recordUtils'
import { scrollToElement } from '~/utils'
import { GameRankingItem } from './GameRankingItem'

export function WeeklyReport(): React.JSX.Element {
  const { t } = useTranslation('record')
  const router = useRouter()
  const search = useSearch({ from: '/record' })
  const selectedDate = new Date(search.date)

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

  // const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const weekData = getWeeklyPlayData(selectedDate)

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
  const dailyChartData = weekData.dates.map((date) => {
    const dayDate = parseLocalDate(date)
    return {
      date,
      weekday: getLocalizedWeekday(dayDate.getDay()),
      playTime: (weekData.dailyPlayTime[date] || 0) / 60000, // Convert to minutes
      fullDate: date
    }
  })

  interface timeLineRow {
    gameLabel: string
    gameId: string
    color: string
    [key: `offset${number}`]: number
    [key: `duration${number}`]: number
    endOffset: number
  }

  const timeLineChartDataFlat: timeLineRow[] = Object.entries(weekData.weeklyPlayTimers).map(
    ([gameId, timers], gameIndex) => {
      const gameLabel = getGameStore(gameId).getState().getValue('metadata.name')
      const color = gameIndex % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'

      const row: timeLineRow = {
        gameLabel,
        gameId,
        color,
        endOffset: 0
      }

      let accumulated = 0
      timers.forEach((timer, idx) => {
        const startTime = new Date(timer.start).getTime() - weekStartTime
        const endTime = new Date(timer.end).getTime() - weekStartTime
        const duration = endTime - startTime

        const offset = startTime - accumulated
        row[`offset${idx}`] = offset
        row[`duration${idx}`] = duration

        accumulated += offset + duration
      })
      row.endOffset = nextWeekStart.getTime() - weekStartTime - accumulated

      return row
    }
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
          <CardHeader>
            <CardTitle>{t('weekly.playTimeLine.title')}</CardTitle>
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

                          const row = data[0].payload
                          const gameName = row.gameLabel

                          let totalTime = 0
                          for (let i = 0; i < maxTimersCount; i++) {
                            const durationKey = `duration${i}`
                            if (row[durationKey] != null) {
                              totalTime += row[durationKey]
                            }
                          }

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
          <CardHeader>
            <CardTitle>{t('weekly.weeklyGames.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekData.mostPlayedGames.length > 0 ? (
                weekData.mostPlayedGames.map((game, index) => (
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
    </div>
  )
}
