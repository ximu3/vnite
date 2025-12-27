import { useRouter, useSearch } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { SettingsPopover } from '@ui/popover'
import { ScrollArea } from '@ui/scroll-area'
import { Switch } from '@ui/switch'
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Sector,
  XAxis,
  YAxis
} from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { useConfigState } from '~/hooks'
import { getYearlyPlayData } from '~/stores/game/recordUtils'
import { GameRankingItem } from './GameRankingItem'
import { StatCard } from './StatCard'

export function YearlyReport(): React.JSX.Element {
  const { t } = useTranslation('record')
  const [hideLowPercentType, setHideLowPercentType] = useConfigState(
    'record.yearly.hideLowPercentType'
  )

  const [showGameTypeDetail, setShowGameTypeDetail] = useState(false)
  const [typeDetailIndex, setTypeDetailIndex] = useState<number>(0)

  const router = useRouter()
  const search = useSearch({ from: '/record' })
  const selectedYear = Number(search.year)

  const setSelectedYear = (newYear: number): void => {
    router.navigate({
      to: '/record',
      search: {
        ...search,
        year: newYear.toString()
      }
    })
  }

  const handleBarClick = (data: any): void => {
    type MonthlyChartItem = (typeof monthlyChartData)[number]
    const { originalMonth } = data.payload as MonthlyChartItem
    const dateUTC = new Date(Date.UTC(selectedYear, originalMonth, 2, 0, 0, 0, 0)) // to avoid timezone issues
    const isoDate = dateUTC.toISOString()

    router.navigate({
      to: '/record',
      search: {
        tab: 'monthly',
        date: isoDate,
        year: dateUTC.getFullYear().toString()
      }
    })
  }
  const handleDotClick = (data: any): void => {
    type MonthlyChartItem = (typeof monthlyDaysChartData)[number]
    const { originalMonth } = data.payload as MonthlyChartItem
    const dateUTC = new Date(Date.UTC(selectedYear, originalMonth, 2, 0, 0, 0, 0))
    const isoDate = dateUTC.toISOString()

    router.navigate({
      to: '/record',
      search: {
        tab: 'monthly',
        date: isoDate,
        year: search.year
      }
    })
  }

  // selectedYear is from search: const selectedYear = Number(search.year)
  const yearData = useMemo(() => getYearlyPlayData(selectedYear), [search])

  const goToPreviousYear = (): void => setSelectedYear(selectedYear - 1)
  const goToNextYear = (): void => setSelectedYear(selectedYear + 1)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousYear()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextYear()
      }
    }

    window.addEventListener('keydown', handleKey, { capture: true })
    return () => window.removeEventListener('keydown', handleKey, { capture: true })
  }, [goToPreviousYear, goToNextYear])

  // Month Name Localization
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

  // Preparing data for charts
  const monthlyChartData = yearData.monthlyPlayTime.map((item) => ({
    month: getLocalizedMonth(item.month),
    playTime: item.playTime / 3600000, // Convert to hours
    originalMonth: item.month
  }))

  const monthlyDaysChartData = yearData.monthlyPlayDays.map((item) => ({
    month: getLocalizedMonth(item.month),
    playDays: item.days,
    originalMonth: item.month
  }))

  // Preparing data for pie chart
  const pieChartData = yearData.gameTypeDistribution
    .map((item, index) => ({
      ...item,
      percentValue: item.summary / yearData.totalTime, // Adding percentage data
      color: `var(--chart-${(index % 5) + 1})` // Using shadcn's chart color variable
    }))
    .filter((item) => item.percentValue >= (hideLowPercentType ? 0.02 : 0))

  const barChartConfig = {
    playTime: {
      label: t('yearly.stats.yearlyPlayTime'),
      color: 'var(--primary)'
    }
  }

  const lineChartConfig = {
    playDays: {
      label: t('yearly.chart.monthlyPlayDays'),
      color: 'var(--primary)'
    }
  }

  const pieChartConfig = yearData.gameTypeDistribution.reduce(
    (config, item, index) => {
      config[item.type] = {
        label: item.type,
        color: `var(--chart-${(index % 5) + 1})`
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('yearly.title')}</h2>
        {/* Year Navigation */}
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

      {/* Yearly Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Yearly Play Time */}
        <StatCard
          title={t('yearly.stats.yearlyPlayTime')}
          value={formatGameTime(yearData.totalTime)}
          icon={<Clock className="w-4 h-4" />}
          className="col-span-1"
        />
        {/* Total Play Months */}
        <StatCard
          title={t('yearly.stats.monthsPlayed')}
          value={t('yearly.stats.monthsCount', {
            count: yearData.monthlyPlayTime.filter((m) => m.playTime > 0).length
          })}
          icon={<CalendarIcon className="w-4 h-4" />}
          className="col-span-1"
        />
        {/* Most Played Month */}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Monthly Play Time Chart */}
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
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={(value) => formatGameTime((value as number) * 3600000)}
                      hideIndicator={false}
                      color="var(--primary)"
                    />
                  )}
                />
                <Bar
                  dataKey="playTime"
                  fill="var(--primary)"
                  onClick={handleBarClick}
                  cursor="pointer"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        {/* Monthly Play Days Chart */}
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
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={formatDays}
                      hideIndicator={false}
                      color="var(--primary)"
                    />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="playDays"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 0 }}
                  activeDot={{
                    r: 4,
                    fill: 'var(--primary)',
                    cursor: 'pointer',
                    onClick: (_e, payload) => handleDotClick(payload)
                  }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
        {/* Game Type Distribution Pie Chart */}
        <Card>
          <CardHeader className="flex flex-row">
            <div className="flex flex-col">
              <CardTitle>{t('yearly.chart.timeDistribution')}</CardTitle>
              <CardDescription>{t('yearly.chart.byGameType')}</CardDescription>
            </div>
            <SettingsPopover className="flex justify-between">
              <p className="text-sm font-medium text-foreground">
                {t('yearly.chart.hideLowPercentType')}
              </p>
              <Switch checked={hideLowPercentType} onCheckedChange={setHideLowPercentType} />
            </SettingsPopover>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  activeShape={(props: any) => <Sector {...props} outerRadius={105} />}
                  labelLine={false}
                  outerRadius={100}
                  dataKey="summary"
                  nameKey="type"
                  onClick={(_data, index) => {
                    setTypeDetailIndex(index)
                    setShowGameTypeDetail(true)
                  }}
                  // During the Pie chart animation, labels temporarily disappear and only show after the animation completes.
                  // Toggling the Dialog state causes a re-render, which retriggers the animation and makes the labels vanish briefly.
                  // To improve the UX, the animation is temporarily disabled so that labels remain visible immediately when the Dialog closes.
                  // In the future, this could potentially be addressed by isolating this component to prevent unnecessary re-renders.
                  isAnimationActive={false}
                  cursor="pointer"
                  label={({ type, percentValue }) =>
                    t('yearly.chart.typePercentage', {
                      type,
                      percent: (percentValue * 100).toFixed(0)
                    })
                  }
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      formatter={(value) => formatGameTime(Number(value))}
                      labelKey="type"
                      hideIndicator={false}
                    />
                  )}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        {/* Yearly Game Rankings */}
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
              <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                {t('yearly.yearlyGames.noRecords')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Rating Ranking - Dialog */}
      <Dialog open={showGameTypeDetail} onOpenChange={setShowGameTypeDetail}>
        {pieChartData[typeDetailIndex] && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('yearly.dialog.gameTypeDetail')}</DialogTitle>
              <DialogDescription>{pieChartData[typeDetailIndex].type}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="w-[500px] space-y-2">
                {pieChartData[typeDetailIndex].detail.map(({ gameId, playTime }, index) => (
                  <GameRankingItem
                    key={gameId}
                    gameId={gameId}
                    rank={index + 1}
                    extraInfo={formatGameTime(playTime)}
                  />
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
