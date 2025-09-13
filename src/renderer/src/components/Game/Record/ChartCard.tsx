import { DateTimeInput } from '@ui/date-input'
import { isEqual } from 'lodash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StepperInput } from '~/components/ui/input'
import { SeparatorDashed } from '~/components/ui/separator-dashed'
import { getGamePlayTimeByDateRange, getGameStartAndEndDate } from '~/stores/game'
import { cn } from '~/utils'
import { TimerChart } from './TimerChart'

export function ChartCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const timers = getGameStartAndEndDate(gameId)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minValue, setMinValue] = useState(0)
  const [playTimeByDateRange, setPlayTimeByDateRange] = useState<Record<string, number>>({})

  useEffect(() => {
    setStartDate(timers.start)
    setEndDate(timers.end)
  }, [timers.start, timers.end])

  const isDateInRange = (date: string): boolean => {
    if (!date || !timers.start || !timers.end) return false
    return date >= timers.start && date <= timers.end
  }

  useEffect(() => {
    // Get data only if both dates are valid and within the allowed range
    if (
      startDate &&
      endDate &&
      isDateInRange(startDate) &&
      isDateInRange(endDate) &&
      startDate <= endDate
    ) {
      const data = getGamePlayTimeByDateRange(gameId, startDate, endDate)
      setPlayTimeByDateRange(data)
    }
  }, [startDate, endDate, timers.start, timers.end, gameId])

  return (
    <div className={cn(className, 'flex flex-col')}>
      <div className={cn('font-bold')}>{t('detail.chart.title')}</div>
      <SeparatorDashed />
      {!isEqual(timers, { start: '', end: '' }) ? (
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
          </div>
          {!startDate || !endDate ? (
            t('detail.chart.selectRange')
          ) : startDate > endDate ? (
            <div>{t('detail.chart.dateError')}</div>
          ) : !isDateInRange(startDate) || !isDateInRange(endDate) ? (
            <div>
              {t('detail.chart.rangeLimit', { startDate: timers.start, endDate: timers.end })}
            </div>
          ) : (
            <div className={cn('max-h-full rounded-lg py-3', '3xl:max-h-full')}>
              <TimerChart
                data={playTimeByDateRange}
                minMinutes={minValue}
                className={cn('w-full max-h-[30vh] -ml-3')}
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
