import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Calendar } from '@ui/calendar'
import { ChevronLeft, ChevronRight, Clock, CalendarIcon, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
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
  const weeklyChartData = monthData.weeklyPlayTime.map((item) => ({
    week: `第${item.week}周`,
    playTime: item.playTime / 3600000, // 转换为小时
    weekDisplay: `第${item.week}周`, // 添加显示字段用于tooltip
    weekNumber: item.week // 保存原始周数以备使用
  }))

  // Chart配置
  const chartConfig = {
    playTime: {
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  // 自定义值格式化函数
  const valueFormatter = (value: ValueType): string => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)} 小时`
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
              <BarChart data={weeklyChartData}>
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
                <Bar dataKey="playTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
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

      <Card>
        <CardHeader>
          <CardTitle>本月热门游戏</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
  )
}
