import { Card } from '@ui/card'
import { DateInput } from '@ui/date-input'
import { cn } from '~/utils'
import { useGameRecords } from '~/hooks'
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
  const { getGamePlayTimeByDateRange, getGameStartAndEndDate } = useGameRecords()
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
    <Card className={cn(className, 'p-3 flex flex-col gap-3')}>
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
            <Card className={cn('p-5 max-h-full rounded-[0.3rem]', '3xl:max-h-full')}>
              <TimerChart
                data={playTimeByDateRange}
                className={cn('max-h-[500px] w-full -ml-3', '3xl:max-h-[680px] sm:max-h-[42vh]')}
              />
            </Card>
          )}
        </>
      ) : (
        <div>暂无数据</div>
      )}
    </Card>
  )
}
