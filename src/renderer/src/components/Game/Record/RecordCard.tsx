import { Card } from '@ui/card'
import { cn } from '~/utils'
import { useGameTimers, useDBSyncedState } from '~/hooks'
import { formatTimeToChinese, formatDateToChinese } from '~/utils'

export function RecordCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [addDate] = useDBSyncedState('', `games/${gameId}/record.json`, ['addDate'])
  const { gameTimers, getGamePlayDays, getGamePlayingTime, getGameMaxPlayTimeDay } = useGameTimers()
  const playDays = getGamePlayDays(gameId)
  const playingTime = getGamePlayingTime(gameId)
  const equalPlayingTime = getGamePlayingTime(gameId) / getGamePlayDays(gameId)
  const lastRunDate = gameTimers[gameId]?.at(-1)?.start
  const maxPlayTimeDay = getGameMaxPlayTimeDay(gameId)
  return (
    <Card className={cn(className, 'p-3 w-auto')}>
      <div className={cn('flex flex-row')}>
        <div>
          <span>你在</span>
          <span className={cn('font-bold')}> {playDays} </span>
          <span>天中游玩了</span>
          <span className={cn('font-bold')}> {formatTimeToChinese(playingTime)}</span>
          <span>，平均每天</span>
          <span className={cn('font-bold')}> {formatTimeToChinese(equalPlayingTime)}</span>
          <span>，</span>
        </div>
        <div>
          <span>曾在</span>
          <span className={cn('font-bold')}>
            {' '}
            {maxPlayTimeDay && formatDateToChinese(maxPlayTimeDay.date)}{' '}
          </span>
          <span>沉浸其中</span>
          <span className={cn('font-bold')}>
            {' '}
            {maxPlayTimeDay && formatTimeToChinese(maxPlayTimeDay.playingTime)}
          </span>
          <span>。</span>
        </div>
      </div>
      <div className={cn('flex flex-row')}>
        <div>
          <span>你在</span>
          <span className={cn('font-bold')}> {formatDateToChinese(addDate)} </span>
          <span>添加了该游戏，</span>
        </div>
        <div>
          <span>在</span>
          <span className={cn('font-bold')}>
            {' '}
            {lastRunDate && formatDateToChinese(lastRunDate)}{' '}
          </span>
          <span>最后一次游玩，</span>
        </div>
        <div>希望这段旅程能给你留下有趣的回忆。</div>
      </div>
    </Card>
  )
}
