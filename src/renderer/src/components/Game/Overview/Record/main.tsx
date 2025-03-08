import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { RecordCard } from './RecordCard'
import { useGameState } from '~/hooks'

export function Record({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [lastRunDate] = useGameState(gameId, 'record.lastRunDate')
  const [playStatus] = useGameState(gameId, 'record.playStatus')
  const [score] = useGameState(gameId, 'record.score')
  const [playingTime] = useGameState(gameId, 'record.playTime')

  return (
    <div className={cn('flex flex-row items-center')}>
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.playTime')}
        content={
          playingTime !== 0
            ? t('{{date, gameTime}}', { date: playingTime })
            : t('detail.overview.information.empty')
        }
        icon="icon-[mdi--timer-outline] w-[16px] h-[16px]"
      />
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.lastRunDate')}
        content={
          lastRunDate
            ? t('{{date, niceDate}}', { date: lastRunDate })
            : t('detail.overview.record.neverRun')
        }
        icon="icon-[mdi--calendar-blank-multiple] w-[16px] h-[16px]"
      />
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.playStatus')}
        content={t(`detail.header.playStatus.${playStatus}`)}
        icon="icon-[mdi--bookmark-outline] w-[16px] h-[16px]"
      />
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.rating')}
        content={score === -1 ? t('detail.overview.information.empty') : score.toFixed(1)}
        icon="icon-[mdi--starburst-outline] w-[16px] h-[16px]"
      />
    </div>
  )
}
