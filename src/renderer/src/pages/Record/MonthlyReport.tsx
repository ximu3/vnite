import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Calendar } from '@ui/calendar'
import { ChevronLeft, ChevronRight, Clock, CalendarIcon, Trophy } from 'lucide-react'
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { Separator } from '@ui/separator'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { StatCard } from './StatCard'
import { GameRankingItem } from './GameRankingItem'
import {
  getMonthlyPlayData,
  formatChineseDate,
  formatPlayTimeWithUnit
} from '~/stores/game/recordUtils'

export function MonthlyReport(): JSX.Element {
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
  const monthNames = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月'
  ]
  const currentMonthName = monthNames[selectedDate.getMonth()]

  // 为图表准备数据
  const weeklyChartData = monthData.weeklyPlayTime
    .map((item) => ({
      week: `第${item.week}周`,
      playTime: item.playTime / 3600000, // 转换为小时
      weekDisplay: `第${item.week}周`, // 添加显示字段用于tooltip
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
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  // 自定义值格式化函数
  const valueFormatter = (value: ValueType): string => {
    // value是每周游戏时间，单位为小时或分钟
    if (typeof value === 'number') {
      if (value >= 1) {
        return `${value.toFixed(1)} 小时`
      }
      return `${Math.round(value * 60)} 分钟`
    }
    return String(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">月度游戏报告</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">
            {selectedDate.getFullYear()}年 {currentMonthName}
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
          title="本月游戏时长"
          value={formatPlayTimeWithUnit(monthData.totalTime)}
          icon={<Clock className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title="本月游戏天数"
          value={`${Object.values(monthData.dailyPlayTime).filter((time) => time > 0).length}天`}
          icon={<CalendarIcon className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title="游戏最多的一天"
          value={
            monthData.mostPlayedDay ? formatChineseDate(monthData.mostPlayedDay.date) : '无记录'
          }
          description={
            monthData.mostPlayedDay
              ? `游戏时长：${formatPlayTimeWithUnit(monthData.mostPlayedDay.playTime)}`
              : ''
          }
          icon={<Trophy className="w-4 h-4" />}
          className="col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,auto]">
        <Card>
          <CardHeader>
            <CardTitle>每周游戏时长</CardTitle>
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
                      formatter={valueFormatter}
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
            <CardTitle>月度游戏日历</CardTitle>
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
            <CardTitle>本月数据亮点</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 游戏时间最长的一周 */}
              {mostPlayedWeek && mostPlayedWeekDateRange ? (
                <div>
                  <p className="text-sm text-muted-foreground">游戏时间最长的一周</p>
                  <p className="text-lg font-bold">
                    {mostPlayedWeek.week}（{mostPlayedWeekDateRange.start.getDate()}日-
                    {mostPlayedWeekDateRange.end.getDate()}日）
                  </p>
                  <p className="text-sm">游戏时长：{valueFormatter(mostPlayedWeek.playTime)}</p>
                </div>
              ) : (
                <p>本月没有游戏记录</p>
              )}

              <Separator />

              {/* 游戏频率 */}
              <div>
                <p className="text-sm text-muted-foreground">游戏频率</p>
                <p className="text-lg font-bold">
                  {Object.values(monthData.dailyPlayTime).filter((time) => time > 0).length} /{' '}
                  {Object.keys(monthData.dailyPlayTime).length} 天
                </p>
                <p className="text-sm">
                  占本月{' '}
                  {Math.round(
                    (Object.values(monthData.dailyPlayTime).filter((time) => time > 0).length /
                      Object.keys(monthData.dailyPlayTime).length) *
                      100
                  )}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本月热门游戏</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 -mt-1">
            {monthData.mostPlayedGames.length > 0 ? (
              monthData.mostPlayedGames.map((game, index) => (
                <GameRankingItem
                  key={game.gameId}
                  gameId={game.gameId}
                  rank={index + 1}
                  extraInfo={formatPlayTimeWithUnit(game.playTime)}
                />
              ))
            ) : (
              <p className="col-span-2">本月没有游戏记录</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
