import { DateInput } from '@ui/date-input'
import { Separator } from '@ui/separator'
import { cn } from '~/utils'
import { useGameStore } from '~/stores'
import { useState, useEffect } from 'react'
import { TimerChart } from './TimerChart'
import { isEqual } from 'lodash'

export function ChartCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const { getGamePlayTimeByDateRange, getGameStartAndEndDate } = useGameStore()
  const timers = getGameStartAndEndDate(gameId)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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
      <div className={cn('font-bold')}>时长图表</div>
      <Separator className={cn('my-3 bg-primary')} />
      {!isEqual(timers, { start: '', end: '' }) ? (
        <>
          <div className={cn('flex flex-row gap-2 items-center')}>
            <DateInput
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn('')}
            />
            <div>-</div>
            <DateInput
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn('')}
            />
          </div>
          {!startDate || !endDate ? (
            '请选择日期范围'
          ) : startDate > endDate ? (
            <div>开始日期不能晚于结束日期</div>
          ) : !isDateInRange(startDate) || !isDateInRange(endDate) ? (
            <div>
              请选择在 {timers.start} 到 {timers.end} 之间的日期
            </div>
          ) : (
            <div className={cn('max-h-full rounded-lg py-3', '3xl:max-h-full')}>
              <TimerChart data={playTimeByDateRange} className={cn('w-full -ml-3')} />
            </div>
          )}
        </>
      ) : (
        <div>暂无数据</div>
      )}
    </div>
  )
}
