import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { ChevronLeft, ChevronRight, Clock, CalendarIcon, Trophy } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { StatCard } from './StatCard'
import { GameRankingItem } from './GameRankingItem'
import { getYearlyPlayData, formatPlayTimeWithUnit } from '~/stores/game/recordUtils'

export function YearlyReport(): JSX.Element {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const yearData = getYearlyPlayData(selectedYear)

  // 上一年/下一年
  const goToPreviousYear = (): void => setSelectedYear(selectedYear - 1)
  const goToNextYear = (): void => setSelectedYear(selectedYear + 1)

  // 月份名称
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

  // 为图表准备数据
  const monthlyChartData = yearData.monthlyPlayTime.map((item) => ({
    month: monthNames[item.month],
    playTime: item.playTime / 3600000, // 转换为小时
    originalMonth: item.month // 保存原始月份数据
  }))

  const monthlyDaysChartData = yearData.monthlyPlayDays.map((item) => ({
    month: monthNames[item.month],
    playDays: item.days,
    originalMonth: item.month
  }))

  // 饼图的数据处理
  const pieChartData = yearData.gameTypeDistribution.map((item, index) => ({
    ...item,
    percentValue: item.playTime / yearData.totalTime, // 添加百分比数据
    color: `var(--chart-${(index % 5) + 1})` // 使用shadcn的chart颜色变量
  }))

  // Chart配置
  const barChartConfig = {
    playTime: {
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  const lineChartConfig = {
    playDays: {
      label: '游戏天数',
      color: 'hsl(var(--primary))'
    }
  }

  const pieChartConfig = yearData.gameTypeDistribution.reduce(
    (config, item, index) => {
      config[item.type] = {
        label: item.type,
        color: `hsl(var(--chart-${(index % 5) + 1}))`
      }
      return config
    },
    {} as Record<string, { label: string; color: string }>
  )

  // 格式化函数
  const formatHours = (value: ValueType): string => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)} 小时`
    }
    return String(value)
  }

  const formatDays = (value: ValueType): string => {
    if (typeof value === 'number') {
      return `${value} 天`
    }
    return String(value)
  }

  const formatPieValue = (value: ValueType): string => {
    if (typeof value === 'number') {
      return formatPlayTimeWithUnit(value)
    }
    return String(value)
  }

  return (
    <div className="pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">年度游戏报告</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousYear}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">{selectedYear}年</div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextYear}
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="年度游戏时长"
          value={formatPlayTimeWithUnit(yearData.totalTime)}
          icon={<Clock className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title="游戏月份数"
          value={`${yearData.monthlyPlayTime.filter((m) => m.playTime > 0).length}个月`}
          icon={<CalendarIcon className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title="游戏最多的月份"
          value={yearData.mostPlayedMonth ? monthNames[yearData.mostPlayedMonth.month] : '无记录'}
          description={
            yearData.mostPlayedMonth
              ? `游戏时长：${formatPlayTimeWithUnit(yearData.mostPlayedMonth.playTime)}`
              : ''
          }
          icon={<Trophy className="w-4 h-4" />}
          className="col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>月度游戏时长</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={formatHours}
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
            <CardTitle>月度游戏天数</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyDaysChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={formatDays}
                      hideIndicator={false}
                      color="hsl(var(--primary))"
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="playDays"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 将年度游戏时间分布和年度热门游戏放在同一行 */}
      <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4">
        <Card>
          <CardHeader>
            <CardTitle>年度游戏时间分布</CardTitle>
            <CardDescription>按游戏类型统计</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="playTime"
                  nameKey="type"
                  label={({ type, percentValue }) => `${type}: ${(percentValue * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={formatPieValue}
                      nameKey="type"
                      hideIndicator={false}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>年度热门游戏</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {yearData.mostPlayedGames.length > 0 ? (
              yearData.mostPlayedGames.map((game, index) => (
                <GameRankingItem
                  key={game.gameId}
                  gameId={game.gameId}
                  rank={index + 1}
                  extraInfo={formatPlayTimeWithUnit(game.playTime)}
                />
              ))
            ) : (
              <p className="col-span-full">本年度没有游戏记录</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
