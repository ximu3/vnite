import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { cn } from '~/utils'
import type { ValueType } from '@ui/chart'

interface DailyPlayTime {
  [date: string]: number
}

interface ChartData {
  date: string
  playTime: number
}

export const TimerChart = ({
  data,
  className
}: {
  data: DailyPlayTime
  className?: string
}): JSX.Element => {
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

  // Converting data into the format Recharts needs
  const chartData: ChartData[] = Object.entries(data).map(([date, playTime]) => ({
    date,
    playTime: Math.round(playTime / 1000 / 60) // Converting milliseconds to minutes
  }))

  // Chart Configuration
  const chartConfig = {
    playTime: {
      label: '游玩时长',
      color: 'var(--primary)'
    }
  }
  return (
    <ChartContainer config={chartConfig} className={cn(className)}>
      <BarChart data={chartData}>
        {/* Adding Grid Lines */}
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        {/* X-shaft alignment */}
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => value.slice(5)} // Month-Day only
        />

        {/* Y-shaft arrangement */}
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />

        {/* Adding Interactive Tips */}
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={formatPlayTime}
              hideIndicator={false}
              color="hsl(var(--primary))"
            />
          }
        />

        {/* histogram */}
        <Bar
          dataKey="playTime"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]} // terete
        />
      </BarChart>
    </ChartContainer>
  )
}
