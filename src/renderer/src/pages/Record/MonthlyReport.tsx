import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Calendar } from '@ui/calendar'
import { ChevronLeft, ChevronRight, Clock, CalendarIcon, Trophy } from 'lucide-react'
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { Separator } from '@ui/separator'

import { StatCard } from './StatCard'
import { GameRankingItem } from './GameRankingItem'
import { getMonthlyPlayData } from '~/stores/game/recordUtils'

export function MonthlyReport(): JSX.Element {
  // 使用record命名空间
  const { t } = useTranslation('record')

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const monthData = getMonthlyPlayData(selectedDate)

  // 上个月/下个月
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

  // 获取月份名称
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

  // 为图表准备数据
  const weeklyChartData = monthData.weeklyPlayTime
    .map((item) => ({
      week: t('monthly.chart.weekFormat', { week: item.week }),
      playTime: item.playTime / 3600000, // 转换为小时
      weekDisplay: t('monthly.chart.weekFormat', { week: item.week }), // 添加显示字段用于tooltip
      weekNumber: item.week // 保存原始周数以备使用
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber) // 确保按周数排序

  // 找出游戏时长最长的一周
  const mostPlayedWeek =
    weeklyChartData.length > 0
      ? weeklyChartData.reduce(
          (max, current) => (current.playTime > max.playTime ? current : max),
          weeklyChartData[0]
        )
      : null

  // 计算最长游戏周的日期范围
  function getWeekDateRange(
    year: number,
    month: number,
    weekNumber: number
  ): { start: Date; end: Date } {
    // 获取该月第一天
    const firstDayOfMonth = new Date(year, month, 1)

    // 计算月第一周的序号 (0-based)
    const firstWeekNumber = Math.floor(
      (firstDayOfMonth.getDate() - 1 + firstDayOfMonth.getDay()) / 7
    )

    // 计算目标周与第一周的差值
    const weekDiff = weekNumber - firstWeekNumber

    // 计算目标周的第一天
    const startDay = new Date(year, month, 1 + weekDiff * 7 - firstDayOfMonth.getDay())

    // 计算目标周的最后一天
    const endDay = new Date(startDay)
    endDay.setDate(startDay.getDate() + 6)

    // 确保日期不超出当月范围
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    if (endDay.getMonth() !== month) {
      endDay.setDate(lastDayOfMonth)
    }

    return { start: startDay, end: endDay }
  }

  // 获取最长游戏周的日期范围
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

  // Chart配置
  const chartConfig = {
    playTime: {
      label: t('overview.stats.totalPlayTime'),
      color: 'hsl(var(--primary))'
    }
  }

  // 游戏时间格式化函数
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
          value={`${Object.values(monthData.dailyPlayTime).filter((time) => time > 0).length}${t('monthly.unit.days')}`}
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
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatGameTime((value as number) * 3600000)}
                      labelFormatter={(week) => `${week}`}
                      hideIndicator={false}
                      color="hsl(var(--primary))"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="playTime"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={0.3}
                  fill="hsl(var(--primary))"
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
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full border rounded-md"
              modifiers={{
                played: (date) => {
                  const dateStr = date.toISOString().split('T')[0]
                  return !!monthData.dailyPlayTime[dateStr] && monthData.dailyPlayTime[dateStr] > 0
                }
              }}
              modifiersStyles={{
                played: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 本月数据亮点卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthly.highlights.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 游戏时间最长的一周 */}
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

              {/* 游戏频率 */}
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
