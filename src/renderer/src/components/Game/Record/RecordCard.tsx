import { cn } from '~/utils'
import { useGameState } from '~/hooks'
import { getGameMaxPlayTimeDay, getGamePlayDays } from '~/stores/game'
import { formatTimeToChinese, formatDateToChinese } from '~/utils'
import { Separator } from '@ui/separator'

export function RecordCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [addDate] = useGameState(gameId, 'record.addDate')
  const playDays = getGamePlayDays(gameId)
  const [playingTime] = useGameState(gameId, 'record.playTime')
  const [lastRunDate] = useGameState(gameId, 'record.lastRunDate')
  const [timers] = useGameState(gameId, 'record.timers')
  const equalPlayingTime = playingTime / playDays
  const maxPlayTimeDay = getGameMaxPlayTimeDay(gameId)
  return (
    <div className={cn(className, 'w-auto')}>
      <div className={cn('font-bold')}>游玩数据</div>
      <Separator className={cn('my-3 bg-primary')} />
      {lastRunDate && timers.length !== 0 ? (
        <>
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
                {maxPlayTimeDay && formatTimeToChinese(maxPlayTimeDay.playTime)}
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
        </>
      ) : (
        '你还没有开始游玩这个游戏。'
      )}
    </div>
  )
}
