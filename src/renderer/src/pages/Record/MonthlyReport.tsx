import { Button, buttonVariants } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import { Separator } from '~/components/ui/separator'
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { getMonthlyPlayData } from '~/stores/game/recordUtils'
import { cn } from '~/utils'
import { GameRankingItem } from './GameRankingItem'
import { StatCard } from './StatCard'

export function MonthlyReport(): React.JSX.Element {
  const { t } = useTranslation('record')

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const monthData = getMonthlyPlayData(selectedDate)

  const goToPreviousMonth = (): void => {
    const prevMonth = new Date(selectedDate)
    prevMonth.setMonth(selectedDate.getMonth() - 1)
    setSelectedDate(prevMonth)
  }

  const goToNextMonth = (): void => {
    const nextMonth = new Date(selectedDate)
    nextMonth.setMonth(selectedDate.getMonth() + 1)
    setSelectedDate(nextMonth)
  }

  // Get month name
  const getLocalizedMonth = (monthIndex: number): string => {
    const monthKeys = [
      'monthly.months.january',
      'monthly.months.february',
      'monthly.months.march',
      'monthly.months.april',
      'monthly.months.may',
      'monthly.months.june',
      'monthly.months.july',
      'monthly.months.august',
      'monthly.months.september',
      'monthly.months.october',
      'monthly.months.november',
      'monthly.months.december'
    ]
    return t(monthKeys[monthIndex])
  }

  const currentMonthName = getLocalizedMonth(selectedDate.getMonth())

  // Preparing data for charts
  const weeklyChartData = monthData.weeklyPlayTime
    .map((item) => ({
      week: t('monthly.chart.weekFormat', { week: item.week }),
      playTime: item.playTime / 3600000, // Convert to hours
      weekDisplay: t('monthly.chart.weekFormat', { week: item.week }),
      weekNumber: item.week
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber) // Make sure to sort by weeks

  // Find the week with the longest game
  const mostPlayedWeek =
    weeklyChartData.length > 0
      ? weeklyChartData.reduce(
          (max, current) => (current.playTime > max.playTime ? current : max),
          weeklyChartData[0]
        )
      : null

  // Calculate the date range of the longest game week
  function getWeekDateRange(
    year: number,
    month: number,
    weekNumber: number
  ): { start: Date; end: Date } {
    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1)

    // Serial number of the first week of the calculation month (0-based)
    const firstWeekNumber = Math.floor(
      (firstDayOfMonth.getDate() - 1 + firstDayOfMonth.getDay()) / 7
    )

    // Calculate the difference between the target week and the first week
    const weekDiff = weekNumber - firstWeekNumber

    // Calculate the first day of the target week
    const startDay = new Date(year, month, 1 + weekDiff * 7 - firstDayOfMonth.getDay())

    // Calculate the last day of the target week
    const endDay = new Date(startDay)
    endDay.setDate(startDay.getDate() + 6)

    // Ensure that the date is within the current month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    if (endDay.getMonth() !== month) {
      endDay.setDate(lastDayOfMonth)
    }

    return { start: startDay, end: endDay }
  }

  // Get the date range of the longest game week
  let mostPlayedWeekDateRange: {
    start: Date
    end: Date
  } | null = null
  if (mostPlayedWeek) {
    mostPlayedWeekDateRange = getWeekDateRange(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      mostPlayedWeek.weekNumber
    )
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
    <div className="pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('monthly.title')}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">
            {t('monthly.yearMonth', { year: selectedDate.getFullYear(), month: currentMonthName })}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            disabled={
              new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0) > new Date()
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title={t('monthly.stats.monthlyPlayTime')}
          value={formatGameTime(monthData.totalTime)}
          icon={<Clock className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title={t('monthly.stats.daysPlayed')}
          value={`${Object.values(monthData.dailyPlayTime).filter((time) => time > 0).length} ${t('monthly.unit.days')}`}
          icon={<CalendarIcon className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title={t('monthly.stats.mostPlayedDay')}
          value={
            monthData.mostPlayedDay
              ? t('utils:format.niceDate', { date: new Date(monthData.mostPlayedDay.date) })
              : t('monthly.unit.noRecord')
          }
          description={
            monthData.mostPlayedDay
              ? t('monthly.unit.playTime', { time: monthData.mostPlayedDay.playTime })
              : ''
          }
          icon={<Trophy className="w-4 h-4" />}
          className="col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,auto]">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthly.chart.weeklyPlayTime')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <AreaChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={(value) => formatGameTime((value as number) * 3600000)}
                      labelFormatter={(week) => `${week}`}
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

        <Card>
          <CardHeader>
            <CardTitle>{t('monthly.chart.calendarTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              month={selectedDate} // Controls the displayed month
              onMonthChange={(date) => setSelectedDate(date)}
              className="w-full border rounded-md select-none"
              classNames={{
                day: cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-8 w-8 p-0 font-normal aria-selected:opacity-100'
                ),
                day_outside: 'invisible'
              }}
              modifiers={{
                played: (date) => {
                  const dateStr = t('utils:format.niceISO', { date })
                  return !!monthData.dailyPlayTime[dateStr] && monthData.dailyPlayTime[dateStr] > 0
                }
              }}
              modifiersStyles={{
                today: {
                  backgroundColor: 'hsl(var(--card))',
                  color: 'inherit'
                },
                selected: {
                  backgroundColor: 'hsl(var(--card))',
                  color: 'inherit'
                },
                played: {
                  backgroundColor: 'hsl(var(--primary)/0.8)',
                  color: 'hsl(var(--primary-foreground))'
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* This month's data highlights card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthly.highlights.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Longest week of games */}
              {mostPlayedWeek && mostPlayedWeekDateRange ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('monthly.highlights.longestWeek')}
                  </p>
                  <p className="text-lg font-bold">
                    {t('monthly.chart.weekDateRange', {
                      week: t('monthly.chart.weekFormat', { week: mostPlayedWeek.weekNumber }),
                      startDay: mostPlayedWeekDateRange.start.getDate(),
                      endDay: mostPlayedWeekDateRange.end.getDate()
                    })}
                  </p>
                  <p className="text-sm">
                    {t('monthly.unit.playTime', { time: mostPlayedWeek.playTime * 3600000 })}
                  </p>
                </div>
              ) : (
                <p>{t('monthly.highlights.noRecords')}</p>
              )}

              <Separator />

              {/* Game frequency */}
              <div>
                <p className="text-sm text-muted-foreground">{t('monthly.highlights.frequency')}</p>
                <p className="text-lg font-bold">
                  {t('monthly.highlights.daysCount', {
                    played: Object.values(monthData.dailyPlayTime).filter((time) => time > 0)
                      .length,
                    total: Object.keys(monthData.dailyPlayTime).length
                  })}
                </p>
                <p className="text-sm">
                  {t('monthly.highlights.percentage', {
                    percent: Math.round(
                      (Object.values(monthData.dailyPlayTime).filter((time) => time > 0).length /
                        Object.keys(monthData.dailyPlayTime).length) *
                        100
                    )
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('monthly.monthlyGames.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 -mt-1">
            {monthData.mostPlayedGames.length > 0 ? (
              monthData.mostPlayedGames.map((game, index) => (
                <GameRankingItem
                  key={game.gameId}
                  gameId={game.gameId}
                  rank={index + 1}
                  extraInfo={formatGameTime(game.playTime)}
                />
              ))
            ) : (
              <p className="col-span-2">{t('monthly.monthlyGames.noRecords')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
