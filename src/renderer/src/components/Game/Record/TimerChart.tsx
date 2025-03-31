import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { cn } from '~/utils'
import type { ValueType } from '@ui/chart'
import { useTranslation } from 'react-i18next'

interface DailyPlayTime {
  [date: string]: number
}

interface ChartData {
  date: string
  playTime: number
}

export const TimerChart = ({
  data,
  className,
  filter0 = true
}: {
  data: DailyPlayTime
  className?: string
  filter0?: boolean
}): JSX.Element => {
  const { t } = useTranslation('game')
  const formatGameTime = (time: number): string => {
    return t('utils:format.gameTime', { time })
  }

  // Converting data into the format Recharts needs
  let chartData: ChartData[]

  if (filter0) {
    chartData = Object.entries(data)
      .map(([date, playTime]) => ({
        date,
        playTime: Math.round(playTime / 1000 / 60) // Converting milliseconds to minutes
      }))
      .filter((item) => item.playTime > 0) // Filter out days with 0 hours of gameplay
  } else {
    chartData = Object.entries(data).map(([date, playTime]) => ({
      date,
      playTime: Math.round(playTime / 1000 / 60) // Converting milliseconds to minutes
    }))
  }

  // Chart Configuration
  const chartConfig = {
    playTime: {
      label: t('detail.record.chart.label'),
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
              formatter={(value: ValueType) => formatGameTime((value as number) * 60 * 1000)}
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
