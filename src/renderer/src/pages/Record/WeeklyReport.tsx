import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import { Separator } from '~/components/ui/separator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { getWeeklyPlayData, parseLocalDate } from '~/stores/game/recordUtils'
import { GameRankingItem } from './GameRankingItem'

export function WeeklyReport(): React.JSX.Element {
  const { t } = useTranslation('record')

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
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

  // Formatting weekly date ranges
  const weekStart = parseLocalDate(weekData.dates[0])
  const weekEnd = parseLocalDate(weekData.dates[weekData.dates.length - 1])
  const nextWeekStart = new Date(weekEnd)
  nextWeekStart.setDate(weekEnd.getDate() + 1)
  const weekRange = t('weekly.dateRange', {
    startDate: weekStart,
    endDate: weekEnd
  })

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
                <p>{t('weekly.highlights.noRecords')}</p>
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
                <p>{t('weekly.weeklyGames.noRecords')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
