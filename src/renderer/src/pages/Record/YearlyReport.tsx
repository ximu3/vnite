import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import { getYearlyPlayData } from '~/stores/game/recordUtils'

export function YearlyReport(): JSX.Element {
  // 使用record命名空间
  const { t } = useTranslation('record')

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const yearData = getYearlyPlayData(selectedYear)

  // 上一年/下一年
  const goToPreviousYear = (): void => setSelectedYear(selectedYear - 1)
  const goToNextYear = (): void => setSelectedYear(selectedYear + 1)

  // 月份名称本地化
  const getLocalizedMonth = (monthIndex: number): string => {
    const monthKeys = [
      'yearly.months.january',
      'yearly.months.february',
      'yearly.months.march',
      'yearly.months.april',
      'yearly.months.may',
      'yearly.months.june',
      'yearly.months.july',
      'yearly.months.august',
      'yearly.months.september',
      'yearly.months.october',
      'yearly.months.november',
      'yearly.months.december'
    ]
    return t(monthKeys[monthIndex])
  }

  // 为图表准备数据
  const monthlyChartData = yearData.monthlyPlayTime.map((item) => ({
    month: getLocalizedMonth(item.month),
    playTime: item.playTime / 3600000, // 转换为小时
    originalMonth: item.month // 保存原始月份数据
  }))

  const monthlyDaysChartData = yearData.monthlyPlayDays.map((item) => ({
    month: getLocalizedMonth(item.month),
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
      label: t('yearly.stats.yearlyPlayTime'),
      color: 'hsl(var(--primary))'
    }
  }

  const lineChartConfig = {
    playDays: {
      label: t('yearly.chart.monthlyPlayDays'),
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

  const formatDays = (value: ValueType): string => {
    if (typeof value === 'number') {
      return t('yearly.format.days', { value })
    }
    return String(value)
  }

  const formatGameTime = (time: number): string => {
    return t('utils:format.gameTime', { time })
  }

  return (
    <div className="pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('yearly.title')}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousYear}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">
            {t('yearly.yearDisplay', { year: selectedYear })}
          </div>
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
          title={t('yearly.stats.yearlyPlayTime')}
          value={formatGameTime(yearData.totalTime)}
          icon={<Clock className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title={t('yearly.stats.monthsPlayed')}
          value={t('yearly.stats.monthsCount', {
            count: yearData.monthlyPlayTime.filter((m) => m.playTime > 0).length
          })}
          icon={<CalendarIcon className="w-4 h-4" />}
          className="col-span-1"
        />

        <StatCard
          title={t('yearly.stats.mostPlayedMonth')}
          value={
            yearData.mostPlayedMonth
              ? getLocalizedMonth(yearData.mostPlayedMonth.month)
              : t('yearly.stats.noRecord')
          }
          description={
            yearData.mostPlayedMonth
              ? t('yearly.stats.playTimeDesc', { time: yearData.mostPlayedMonth.playTime })
              : ''
          }
          icon={<Trophy className="w-4 h-4" />}
          className="col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('yearly.chart.monthlyPlayTime')}</CardTitle>
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
                      formatter={(value) => formatGameTime((value as number) * 3600000)}
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
            <CardTitle>{t('yearly.chart.monthlyPlayDays')}</CardTitle>
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
            <CardTitle>{t('yearly.chart.timeDistribution')}</CardTitle>
            <CardDescription>{t('yearly.chart.byGameType')}</CardDescription>
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
                  label={({ type, percentValue }) =>
                    t('yearly.chart.typePercentage', {
                      type,
                      percent: (percentValue * 100).toFixed(0)
                    })
                  }
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatGameTime(Number(value))}
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
            <CardTitle>{t('yearly.yearlyGames.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {yearData.mostPlayedGames.length > 0 ? (
              yearData.mostPlayedGames.map((game, index) => (
                <GameRankingItem
                  key={game.gameId}
                  gameId={game.gameId}
                  rank={index + 1}
                  extraInfo={formatGameTime(game.playTime)}
                />
              ))
            ) : (
              <p className="col-span-full">{t('yearly.yearlyGames.noRecords')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
