import { Trans, useTranslation } from 'react-i18next'
import { SeparatorDashed } from '~/components/ui/separator-dashed'
import { useGameState } from '~/hooks'
import { getGameMaxPlayTimeDay, getGamePlayDays } from '~/stores/game'
import { cn } from '~/utils'

export function RecordCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [addDate] = useGameState(gameId, 'record.addDate')
  const playDays = getGamePlayDays(gameId)
  const [playingTime] = useGameState(gameId, 'record.playTime')
  const [lastRunDate] = useGameState(gameId, 'record.lastRunDate')
  const equalPlayingTime = playingTime / playDays
  const maxPlayTimeDay = getGameMaxPlayTimeDay(gameId)
  const hasDatedPlayData = playDays > 0

  return (
    <div className={cn(className, 'w-auto')}>
      <div className={cn('font-bold')}>{t('detail.record.card.title')}</div>
      <SeparatorDashed />
      {hasDatedPlayData ? (
        <>
          <div className={cn('flex flex-row')}>
            <Trans
              i18nKey="game:detail.record.card.playStats"
              t={t}
              values={{
                days: playDays,
                totalTime: playingTime,
                averageTime: equalPlayingTime
              }}
              components={{
                days: <span className={cn('font-bold')} />,
                totalTime: <span className={cn('font-bold')} />,
                averageTime: <span className={cn('font-bold')} />
              }}
            />

            <Trans
              i18nKey="game:detail.record.card.immersion"
              t={t}
              values={{
                date: maxPlayTimeDay ? maxPlayTimeDay.date : null,
                time: maxPlayTimeDay ? maxPlayTimeDay.playTime : null
              }}
              components={{
                date: <span className={cn('font-bold')} />,
                time: <span className={cn('font-bold')} />
              }}
            />
          </div>
          {lastRunDate && (
            <div className={cn('flex flex-row')}>
              <Trans
                i18nKey="game:detail.record.card.history"
                t={t}
                values={{
                  addDate: addDate,
                  lastPlayDate: lastRunDate
                }}
                components={{
                  addDate: <span className={cn('font-bold')} />,
                  lastPlayDate: <span className={cn('font-bold')} />
                }}
              />
            </div>
          )}
        </>
      ) : (
        t('detail.record.card.noData')
      )}
    </div>
  )
}
