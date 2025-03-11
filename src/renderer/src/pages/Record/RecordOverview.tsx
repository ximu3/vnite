import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { ActivitySquare, Calendar as CalendarIcon, Clock, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@ui/dialog'
import { ScrollArea } from '@ui/scroll-area'

import { formatTimeToChinese } from '~/utils'
import {
  useGameRegistry,
  getTotalplayTime,
  getTotalPlayedDays,
  getTotalPlayedTimes,
  getTotalplayTimeYearly,
  sortGames,
  getGameplayTime,
  getPlayedDaysYearly
} from '~/stores/game'
import { StatCard } from './StatCard'
import { GameRankingItem } from './GameRankingItem'
import { getPlayTimeDistribution } from '~/stores/game/recordUtils'

export function RecordOverview(): JSX.Element {
  const [showMoreTimeGames, setShowMoreTimeGames] = useState(false)
  const [showMoreScoreGames, setShowMoreScoreGames] = useState(false)

  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const totalGames = Object.keys(gameMetaIndex).length
  const totalTime = getTotalplayTime()
  const totalDays = getTotalPlayedDays()
  const totalTimes = getTotalPlayedTimes()
  const playedDaysYearly = getPlayedDaysYearly()

  // 获取所有游戏排序数据，不限制数量
  const allTimeGames = sortGames('record.playTime', 'desc').filter(
    (gameId) => getGameplayTime(gameId) > 0
  )
  const allScoreGames = sortGames('record.score', 'desc').filter(
    (gameId) => gameMetaIndex[gameId].score !== -1
  )

  // 卡片展示仅显示前5名
  const topTimeGames = allTimeGames.slice(0, 5)
  const topScoreGames = allScoreGames.slice(0, 5)

  // 获取游戏时间分布数据并确保24小时数据都存在
  const rawTimeDistribution = getPlayTimeDistribution()

  // 确保所有小时数据都存在，即使是0值
  const timeDistribution = Array.from({ length: 24 }, (_, hour) => {
    const existing = rawTimeDistribution.find((item) => item.hour === hour)
    return existing || { hour, value: 0 }
  }).sort((a, b) => a.hour - b.hour)

  // 为timeDistribution添加自定义label字段，用于tooltip显示
  const enhancedTimeDistribution = timeDistribution.map((item) => ({
    hour: item.hour.toString() + ':00',
    value: item.value,
    timeRange: `${item.hour}:00 - ${(item.hour + 1) % 24}:00`,
    gamingHour: item.value // 重命名value为gamingHour，方便tooltip使用
  }))

  // 获取最热门的游戏时段
  const peakHour = timeDistribution.reduce((max, item) => (item.value > max.value ? item : max), {
    hour: 0,
    value: 0
  })

  // 近一年游戏时间转换为图表数据
  const yearlyPlayData = Object.entries(playedDaysYearly)
    .map(([date, playTime]) => ({
      date,
      playTime: Math.round(playTime / 1000 / 60), // 毫秒转为分钟
      formattedDate: date.slice(5) // 只显示月-日部分
    }))
    .sort((a, b) => a.date.localeCompare(b.date)) // 按日期排序

  // 近一年游戏时间的Chart配置
  const yearlyChartConfig = {
    playTime: {
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  // 分布图的Chart配置
  const distributionChartConfig = {
    gamingHour: {
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  // 自定义值格式化函数
  const hourFormatter = (value: ValueType): string => {
    // value是每日游戏时间，单位为小时或分钟
    if (typeof value === 'number') {
      if (value >= 1) {
        return `${value.toFixed(1)} 小时`
      }
      return `${Math.round(value * 60)} 分钟`
    }
    return String(value)
  }

  // 分钟值格式化函数
  const minuteFormatter = (value: ValueType): string => {
    if (typeof value === 'number') {
      if (value >= 60) {
        const hours = Math.floor(value / 60)
        const mins = value % 60
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
      }
      return `${value}分钟`
    }
    return String(value)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="游戏总数"
          value={`${totalGames}个`}
          icon={<ActivitySquare className="w-4 h-4" />}
        />
        <StatCard
          title="总游戏时间"
          value={formatTimeToChinese(totalTime)}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="总游戏天数"
          value={`${totalDays}天`}
          icon={<CalendarIcon className="w-4 h-4" />}
        />
        <StatCard
          title="游戏次数"
          value={`${totalTimes}次`}
          icon={<Trophy className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr,1fr]">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>近一年游戏时间</CardTitle>
            <CardDescription>{formatTimeToChinese(getTotalplayTimeYearly())}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={yearlyChartConfig} className="h-[250px] 3xl:h-[320px] w-full">
              <AreaChart data={yearlyPlayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickCount={6}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={minuteFormatter}
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

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>游戏时间分布</CardTitle>
            <CardDescription>
              游戏高峰时段: {peakHour.hour}:00 - {(peakHour.hour + 1) % 24}:00
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={distributionChartConfig}
              className="h-[250px] 3xl:h-[320px] w-full"
            >
              <BarChart data={enhancedTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timeRange"
                  tickFormatter={(hour) => `${hour}`.split(':')[0]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={hourFormatter}
                      hideIndicator={false}
                      nameKey="timeRange"
                      color="hsl(var(--primary))"
                    />
                  }
                />
                <Bar dataKey="gamingHour" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>游戏时间排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topTimeGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={formatTimeToChinese(getGameplayTime(gameId))}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => setShowMoreTimeGames(true)}>
              查看更多
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>游戏评分排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topScoreGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={gameMetaIndex[gameId].score?.toString() || '暂无评分'}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => setShowMoreScoreGames(true)}>
              查看更多
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 游戏时间排行 - 对话框 */}
      <Dialog open={showMoreTimeGames} onOpenChange={setShowMoreTimeGames}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>游戏时间排行</DialogTitle>
            <DialogDescription>按照游玩时间排序的所有游戏</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {allTimeGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={formatTimeToChinese(getGameplayTime(gameId))}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 游戏评分排行 - 对话框 */}
      <Dialog open={showMoreScoreGames} onOpenChange={setShowMoreScoreGames}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>游戏评分排行</DialogTitle>
            <DialogDescription>按照评分排序的所有游戏</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {allScoreGames.map((gameId, index) => (
                <GameRankingItem
                  key={gameId}
                  gameId={gameId}
                  rank={index + 1}
                  extraInfo={gameMetaIndex[gameId].score?.toString() || '暂无评分'}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
