import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { eventBus } from '~/app/events'
import { useConfigState } from '~/hooks'
import { useGameRegistry } from '~/stores/game'
import { cn } from '~/utils'
import { GameList } from './GameList'
import { PositionButton } from './PositionButton'
import { useLibrarybarStore } from './store'

export function Librarybar(): React.JSX.Element {
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const query = useLibrarybarStore((state) => state.query)
  const refreshGameList = useLibrarybarStore((state) => state.refreshGameList)
  const gamesLoaded = useGameRegistry((state) => state.gamesLoaded)
  const { t } = useTranslation('game')

  console.warn(`[DEBUG] Librarybar`)

  useEffect(() => {
    const unsubscribeGameAdded = eventBus.on('game:added', () => {
      refreshGameList()
    })
    const unsubscribeGameDeleted = eventBus.on('game:deleted', () => {
      refreshGameList()
    })

    return () => {
      unsubscribeGameAdded()
      unsubscribeGameDeleted()
    }
  }, [])

  if (!gamesLoaded) {
    return (
      <div className={cn('flex flex-col gap-1 items-center justify-center w-full h-full -mt-7')}>
        <div
          className={cn(
            'animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full'
          )}
        />
        <div className={cn('text-muted-foreground mt-2')}>{t('showcase.loadingGames')}</div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6 bg-transparent w-full h-full relative group shrink-0')}>
      <div className={cn('p-0 w-full h-full')}>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
      <PositionButton />
    </div>
  )
}
