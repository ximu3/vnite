import { Card } from '@ui/card'
import { DateInput } from '@ui/date-input'
import { cn } from '~/utils'
import { useGameTimers } from '~/hooks'
import { useState, useEffect } from 'react'
import { TimerChart } from './TimerChart'

export function ChartCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const { getGamePlayTimeByDateRange, getGameStartAndEndDate } = useGameTimers()
  const timers = getGameStartAndEndDate(gameId)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 使用 useEffect 监听 timers 的变化
  useEffect(() => {
    if (timers.start && timers.end) {
      setStartDate(timers.start)
      setEndDate(timers.end)
    }
  }, [timers.start, timers.end])

  let playTimeByDateRange = {}
  if (startDate && endDate) {
    playTimeByDateRange = getGamePlayTimeByDateRange(gameId, startDate, endDate)
  }
  return (
    <Card className={cn(className, 'p-3 flex flex-col gap-3')}>
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
      <TimerChart data={playTimeByDateRange} />
    </Card>
  )
}
