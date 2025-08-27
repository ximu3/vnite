import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import { cn } from '~/utils'

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
  minMinutes = 0,
  filter0 = true
}: {
  data: DailyPlayTime
  className?: string
  minMinutes?: number
  filter0?: boolean
}): React.JSX.Element => {
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
        playTime: playTime / 1000 / 60 // Converting milliseconds to minutes
      }))
      .filter((item) => item.playTime > minMinutes) // Filter out days less than `minMinutes` hours of gameplay
  } else {
    chartData = Object.entries(data).map(([date, playTime]) => ({
      date,
      playTime: playTime / 1000 / 60 // Converting milliseconds to minutes
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
          content={(props) => (
            <ChartTooltipContent
              {...props}
              formatter={(value: ValueType) => formatGameTime((value as number) * 60 * 1000)}
              hideIndicator={false}
              color="var(--primary)"
            />
          )}
        />

        {/* histogram */}
        <Bar
          dataKey="playTime"
          fill="var(--primary)"
          radius={[4, 4, 0, 0]} // terete
        />
      </BarChart>
    </ChartContainer>
  )
}
