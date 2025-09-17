import { cn } from '~/utils'
import { Button } from '~/components/ui/button'
import { startGame, stopGame } from '~/utils'
import { useTranslation } from 'react-i18next'
import { useRunningGames } from '~/pages/Library/store'

export function StartGame({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const runningGames = useRunningGames((state) => state.runningGames)
  const isGameRunning = runningGames.includes(gameId)

  const handleGameAction = (): void => {
    if (isGameRunning) {
      stopGame(gameId)
    } else {
      startGame(gameId)
    }
  }

  return (
    <Button className={cn('', className)} onClick={handleGameAction}>
      <div className={cn('flex flex-row justify-center gap-1 items-center w-full h-full p-3')}>
        {isGameRunning ? (
          <>
            <span className={cn('icon-[mdi--stop] w-6 h-6 -ml-1')}></span>
            <div className={cn('')}>{t('detail.actions.stop')}</div>
          </>
        ) : (
          <>
            <span className={cn('icon-[mdi--play] w-6 h-6 -ml-1')}></span>
            <div className={cn('')}>{t('detail.actions.start')}</div>
          </>
        )}
      </div>
    </Button>
  )
}
