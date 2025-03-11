import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { GameRankingItem } from './GameRankingItem'
import {
  getWeeklyPlayData,
  formatChineseDate,
  formatPlayTimeWithUnit
} from '~/stores/game/recordUtils'

export function WeeklyReport(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const weekData = getWeeklyPlayData(selectedDate)

  // 上一周/下一周
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

  // 格式化周的日期范围
  const weekStart = new Date(weekData.dates[0])
  const weekEnd = new Date(weekData.dates[weekData.dates.length - 1])
  const weekRange = `${formatChineseDate(weekStart)} - ${formatChineseDate(weekEnd)}`

  // 转换每日游戏时间为图表数据
  const dailyChartData = weekData.dates.map((date) => {
    const dayDate = new Date(date)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return {
      date,
      weekday: weekdays[dayDate.getDay()],
      playTime: (weekData.dailyPlayTime[date] || 0) / 3600000, // 转换为小时
      fullDate: formatChineseDate(date) // 添加完整日期用于tooltip
    }
  })

  // Chart配置
  const chartConfig = {
    playTime: {
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  // 自定义值格式化函数
  const valueFormatter = (value: ValueType): string => {
    // value是每日游戏时间，单位为小时或分钟
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
        <h2 className="text-2xl font-bold">周游戏报告</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">{weekRange}</div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            disabled={new Date(weekEnd) > new Date()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>每日游戏时间</CardTitle>
            <CardDescription>
              本周共游戏 {formatPlayTimeWithUnit(weekData.totalTime)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="weekday" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={valueFormatter}
                      labelFormatter={(weekday, data) => {
                        if (data && data[0]?.payload) {
                          return `${weekday} (${data[0].payload.fullDate})`
                        }
                        return weekday
                      }}
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
            <CardTitle>本周数据亮点</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekData.mostPlayedDay ? (
                <div>
                  <p className="text-sm text-muted-foreground">游戏时间最长的一天</p>
                  <p className="text-lg font-bold">
                    {weekData.mostPlayedDay.weekday}（
                    {formatChineseDate(weekData.mostPlayedDay.date)}）
                  </p>
                  <p className="text-sm">
                    游戏时长：{formatPlayTimeWithUnit(weekData.mostPlayedDay.playTime)}
                  </p>
                </div>
              ) : (
                <p>本周没有游戏记录</p>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">游戏频率</p>
                <p className="text-lg font-bold">
                  {Object.values(weekData.dailyPlayTime).filter((time) => time > 0).length} /{' '}
                  {Object.keys(weekData.dailyPlayTime).length} 天
                </p>
                <p className="text-sm">
                  占本周{' '}
                  {Math.round(
                    (Object.values(weekData.dailyPlayTime).filter((time) => time > 0).length /
                      Object.keys(weekData.dailyPlayTime).length) *
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
            <CardTitle>本周热门游戏</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekData.mostPlayedGames.length > 0 ? (
                weekData.mostPlayedGames.map((game, index) => (
                  <GameRankingItem
                    key={game.gameId}
                    gameId={game.gameId}
                    rank={index + 1}
                    extraInfo={formatPlayTimeWithUnit(game.playTime)}
                  />
                ))
              ) : (
                <p>本周没有游戏记录</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
