import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { Card } from '@ui/card'
import { cn } from '~/utils'
import type { ValueType } from '@ui/chart'

interface DailyPlayTime {
  [date: string]: number
}

interface ChartData {
  date: string
  playTime: number
}

export const TimerChart = ({ data }: { data: DailyPlayTime }): JSX.Element => {
  const formatPlayTime = (value: ValueType): any => {
    if (typeof value === 'number') {
      if (value >= 60) {
        const hours = Math.floor(value / 60)
        const remainingMinutes = value % 60
        if (remainingMinutes === 0) {
          return `${hours} 小时`
        }
        return `${hours}小时${remainingMinutes}分钟`
      }
      return `${value} 分钟`
    }
    return value
  }

  // 将数据转换为 Recharts 需要的格式
  const chartData: ChartData[] = Object.entries(data).map(([date, playTime]) => ({
    date,
    playTime: Math.round(playTime / 1000 / 60) // 将毫秒转换为分钟
  }))

  // 图表配置
  const chartConfig = {
    playTime: {
      label: '游玩时长',
      color: 'var(--primary)' // 使用你的主题色
    }
  }

  return (
    <Card className={cn('p-5 max-h-full rounded-[0.3rem]', '3xl:max-h-full')}>
      <ChartContainer
        config={chartConfig}
        className={cn('max-h-[500px] w-full -ml-3', '3xl:max-h-[680px]')}
      >
        <BarChart data={chartData}>
          {/* 添加网格线 */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          {/* X轴配置 */}
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => value.slice(5)} // 只显示月-日
          />

          {/* Y轴配置 */}
          <YAxis tickLine={false} axisLine={false} tickMargin={10} />

          {/* 添加交互提示 */}
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={formatPlayTime}
                hideIndicator={false}
                color="hsl(var(--primary))"
              />
            }
          />

          {/* 柱状图 */}
          <Bar
            dataKey="playTime"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]} // 圆角柱状
          />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}
