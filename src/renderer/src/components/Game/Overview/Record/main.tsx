import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLibrarybarStore } from '~/components/Librarybar/store'
import { Popover, PopoverContent } from '~/components/ui/popover'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { useGameDetailStore } from '../../store'
import { RecordCard } from './RecordCard'
import { eventBus } from '~/app/events'

export function Record({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [lastRunDate] = useGameState(gameId, 'record.lastRunDate')
  const [score] = useGameState(gameId, 'record.score')
  const [playingTime] = useGameState(gameId, 'record.playTime')
  const [playStatus, setPlayStatus] = useGameState(gameId, 'record.playStatus')
  const { refreshGameList } = useLibrarybarStore.getState()
  const setIsPlayTimeEditorDialogOpen = useGameDetailStore(
    (state) => state.setIsPlayTimeEditorDialogOpen
  )
  const setIsScoreEditorDialogOpen = useGameDetailStore((state) => state.setIsScoreEditorDialogOpen)
  const playStatusOptions: (typeof playStatus)[] = [
    'unplayed',
    'playing',
    'finished',
    'multiple',
    'shelved'
  ]
  const changePlayStatus = (status: typeof playStatus): void => {
    setPlayStatus(status)
    eventBus.emit('game:play-status-changed', { gameId, status }, { source: 'record' })
    refreshGameList()
  }
  return (
    <div className={cn('flex flex-row flex-wrap items-center gap-12 ml-1')}>
      {/* Play Time */}
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.playTime')}
        content={
          playingTime !== 0
            ? t('{{date, gameTime}}', { date: playingTime })
            : t('detail.overview.information.empty')
        }
        icon="icon-[mdi--timer-outline] w-[30px] h-[30px]"
        onClick={() => setIsPlayTimeEditorDialogOpen(true)}
      />
      {/* Last Run Date */}
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.lastRunDate')}
        content={
          lastRunDate
            ? t('{{date, niceDate}}', { date: lastRunDate })
            : t('detail.overview.record.neverRun')
        }
        icon="icon-[mdi--calendar-blank-multiple] w-[28px] h-[28px]"
      />
      {/* Play Status */}
      <Popover>
        <RecordCard
          asPopoverTrigger
          className={cn('')}
          title={t('detail.overview.record.playStatus')}
          content={t(`utils:game.playStatus.${playStatus}`)}
          icon="icon-[mdi--bookmark-outline] w-[32px] h-[32px]"
        />
        <PopoverContent className="max-w-[150px] p-1">
          <div className="flex flex-col">
            {playStatusOptions.map((opt) => (
              <div
                key={opt}
                onClick={() => changePlayStatus(opt)}
                className={cn(
                  'flex flex-row items-center justify-between px-2 py-2 text-sm cursor-pointer',
                  'hover:bg-accent'
                )}
              >
                {t('utils:game.playStatus.' + opt)}
                {playStatus === opt && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {/* Score */}
      <RecordCard
        className={cn('')}
        title={t('detail.overview.record.rating')}
        content={score === -1 ? t('detail.overview.information.empty') : score.toFixed(1)}
        icon="icon-[mdi--starburst-outline] w-[30px] h-[30px]"
        onClick={() => setIsScoreEditorDialogOpen(true)}
      />
    </div>
  )
}
