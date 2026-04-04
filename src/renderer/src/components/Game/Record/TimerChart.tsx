import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart'
import { getBusinessDateKey, getConfiguredDayBoundaryHour } from '~/stores/game/dayBoundaryUtils'
import { formatLocalDateKey, parseLocalDate } from '~/stores/game/recordUtils'
import { cn } from '~/utils'

export interface DailyPlayTime {
  [date: string]: number
}

export type TimeGranularity = 'day' | 'month'

interface ChartData {
  jumpDate: string
  label: string
  granularity: TimeGranularity
  playTime: number
  group: number
}

export const TimerChart = ({
  data,
  className,
  minMinutes = 0,
  filter0 = true,
  granularity = 'day'
}: {
  data: DailyPlayTime
  className?: string
  minMinutes?: number
  filter0?: boolean
  granularity?: TimeGranularity
}): React.JSX.Element => {
  const { t } = useTranslation('game')
  const router = useRouter()
  const formatGameTime = (time: number): string => {
    return t('utils:format.gameTime', { time })
  }

  const handleBarClick = (entry: ChartData): void => {
    const dayBoundaryHour = getConfiguredDayBoundaryHour()
    const queryDate = parseLocalDate(entry.jumpDate)
    queryDate.setHours(23, 59, 59, 999)
    const businessYear = getBusinessDateKey(queryDate, dayBoundaryHour).slice(0, 4)

    router.navigate({
      to: '/record',
      search: {
        tab: entry.granularity === 'month' ? 'monthly' : 'weekly',
        date: queryDate.toISOString(),
        year: businessYear
      }
    })
  }

  // Converting data into the format Recharts needs
  let chartData: ChartData[]

  if (filter0) {
    chartData = Object.entries(data)
      .map(([date, playTime]) => ({
        jumpDate: date,
        label: date.slice(5), // Month-Day
        granularity: 'day' as TimeGranularity,
        playTime: playTime / 1000 / 60, // Converting milliseconds to minutes
        group: 0
      }))
      .filter((item) => item.playTime > minMinutes) // Filter out days less than `minMinutes` of gameplay
  } else {
    chartData = Object.entries(data).map(([date, playTime]) => ({
      jumpDate: date,
      label: date.slice(5), // Month-Day
      granularity: 'day',
      playTime: playTime / 1000 / 60, // Converting milliseconds to minutes
      group: 0
    }))
  }

  // * Granularity Adjustment
  if (granularity === 'month') {
    const monthRecord: Record<string, ChartData> = {}

    chartData.forEach((item) => {
      const date = parseLocalDate(item.jumpDate)
      date.setDate(1)
      const key = formatLocalDateKey(date)

      if (!monthRecord[key]) {
        monthRecord[key] = {
          jumpDate: key,
          label: key.slice(0, 7), // YYYY-MM
          granularity: 'month',
          playTime: 0,
          group: 0
        }
      }

      monthRecord[key].playTime += item.playTime
    })

    chartData = Object.values(monthRecord).sort((a, b) => a.jumpDate.localeCompare(b.jumpDate))
  }

  // * Grouping logic: mark group when month/year changes
  if (granularity === 'day') {
    let currentGroup = 0
    let lastMonth: string | null = null

    chartData = chartData.map((item) => {
      const month = item.jumpDate.slice(0, 7) // YYYY-MM
      if (month !== lastMonth && lastMonth !== null) currentGroup = 1 - currentGroup // toggle group
      lastMonth = month
      return { ...item, group: currentGroup }
    })
  } else if (granularity === 'month') {
    let currentGroup = 0
    let lastYear: string | null = null

    chartData = chartData.map((item) => {
      const year = item.jumpDate.slice(0, 4) // YYYY
      if (year !== lastYear && lastYear !== null) currentGroup = 1 - currentGroup // toggle group
      lastYear = year
      return { ...item, group: currentGroup }
    })
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
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />

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
          radius={[4, 4, 0, 0]} // terete
        >
          {chartData.map((entry) => (
            <Cell
              key={`${entry.jumpDate}-${entry.group}`}
              fill={entry.group === 0 ? 'var(--primary)' : 'var(--secondary)'}
              onClick={() => handleBarClick(entry)}
              cursor="pointer"
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
