import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DateTimeInput } from '@ui/date-input'
import { StepperInput } from '@ui/input'
import { SeparatorDashed } from '@ui/separator-dashed'
import { useGameState } from '~/hooks'
import type { GameRecordCalculationSource } from '~/stores/game'
import { getGamePlayTimeByDateRange, getGameStartAndEndDate } from '~/stores/game'
import { cn } from '~/utils'
import { DailyPlayTime, TimeGranularity, TimerChart } from './TimerChart'

function recommendGranularity(chartData: DailyPlayTime): TimeGranularity {
  const monthSet = new Set<string>()

  Object.entries(chartData).forEach(([date, _playTime]) => {
    const month = date.slice(0, 7) // YYYY-MM
    monthSet.add(month)
  })

  const d = Object.keys(chartData).length
  const m = monthSet.size

  if (d <= 30) {
    return 'day'
  } else if (d > 30 && d <= 60) {
    if (m <= 3) {
      return 'day'
    } else {
      return 'month'
    }
  } else {
    return 'month'
  }
}

export function ChartCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [recordTimers] = useGameState(gameId, 'record.timers')
  const [dailyPlayTimes] = useGameState(gameId, 'record.dailyPlayTimes')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minValue, setMinValue] = useState(0)

  const calculationSource = useMemo<GameRecordCalculationSource>(
    () => ({
      timers: recordTimers,
      dailyPlayTimes
    }),
    [recordTimers, dailyPlayTimes]
  )

  const availableRange = useMemo(
    () => getGameStartAndEndDate(gameId, calculationSource),
    [gameId, calculationSource]
  )

  useEffect(() => {
    setStartDate(availableRange.start)
    setEndDate(availableRange.end)
  }, [availableRange.start, availableRange.end])

  const isDateInRange = (date: string): boolean => {
    if (!date || !availableRange.start || !availableRange.end) return false
    return date >= availableRange.start && date <= availableRange.end
  }

  const playTimeByDateRange = useMemo(
    () =>
      Boolean(startDate && endDate) &&
      isDateInRange(startDate) &&
      isDateInRange(endDate) &&
      startDate <= endDate
        ? getGamePlayTimeByDateRange(gameId, startDate, endDate, calculationSource)
        : {},
    [startDate, endDate, gameId, calculationSource]
  )
  const granularity = useMemo(
    () => recommendGranularity(playTimeByDateRange),
    [playTimeByDateRange]
  )

  return (
    <div className={cn(className, 'flex flex-col')}>
      <div className={cn('font-bold')}>{t('detail.chart.title')}</div>
      <SeparatorDashed />
      {availableRange.start && availableRange.end ? (
        <>
          <div className={cn('flex flex-row gap-2 items-center')}>
            <DateTimeInput
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn('')}
            />
            <div>-</div>
            <DateTimeInput
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn('')}
            />
            {granularity === 'day' && (
              <>
                <div className="w-px h-9 bg-primary" />
                <div className={cn('relative flex w-28 items-center')}>
                  <span className="absolute left-2">{'>'}</span>
                  <StepperInput
                    value={minValue}
                    min={0}
                    max={24 * 60}
                    steps={{ default: 1, shift: 10 }}
                    onChange={(e) => setMinValue(Number(e.target.value))}
                    inputClassName="pl-6 pr-8 w-full"
                  />
                  <span className="absolute right-2">min</span>
                </div>
              </>
            )}
          </div>
          {!startDate || !endDate ? (
            t('detail.chart.selectRange')
          ) : startDate > endDate ? (
            <div>{t('detail.chart.dateError')}</div>
          ) : !isDateInRange(startDate) || !isDateInRange(endDate) ? (
            <div>
              {t('detail.chart.rangeLimit', {
                startDate: availableRange.start,
                endDate: availableRange.end
              })}
            </div>
          ) : (
            <div className={cn('max-h-full rounded-lg py-3', '3xl:max-h-full')}>
              <TimerChart
                data={playTimeByDateRange}
                minMinutes={granularity === 'day' ? 0 : minValue}
                className={cn('w-full max-h-[30vh] -ml-3')}
                granularity={granularity}
              />
            </div>
          )}
        </>
      ) : (
        <div>{t('detail.chart.noData')}</div>
      )}
    </div>
  )
}
