import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { ActivitySquare, Calendar as CalendarIcon, Clock, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { TimerChart } from '~/components/Game/Record/TimerChart'
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
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const totalGames = Object.keys(gameMetaIndex).length
  const totalTime = getTotalplayTime()
  const totalDays = getTotalPlayedDays()
  const totalTimes = getTotalPlayedTimes()
  const playedDaysYearly = getPlayedDaysYearly()

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

  // 按照游玩时间排序的游戏
  const topGames = sortGames('record.playTime', 'desc').slice(0, 5)

  // Chart配置
  const chartConfig = {
    gamingHour: {
      label: '游戏时长',
      color: 'hsl(var(--primary))'
    }
  }

  // 自定义值格式化函数
  const valueFormatter = (value: ValueType): string => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} 小时`
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>近一年游戏时间</CardTitle>
            <CardDescription>{formatTimeToChinese(getTotalplayTimeYearly())}</CardDescription>
          </CardHeader>
          <CardContent>
            <TimerChart data={playedDaysYearly} className="w-full h-[250px] -ml-2 3xl:h-[320px]" />
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
            <ChartContainer config={chartConfig} className="h-[250px] 3xl:h-[320px] w-full">
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
                      formatter={valueFormatter}
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

      <Card>
        <CardHeader>
          <CardTitle>游戏时间排行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topGames.map((gameId, index) => (
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
          <Button variant="ghost" className="w-full">
            查看更多
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
