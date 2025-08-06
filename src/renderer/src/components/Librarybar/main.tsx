import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { GameList } from './GameList'
import { PositionButton } from './PositionButton'
import { useLibrarybarStore } from './store'
import { eventBus } from '~/app/events'
import { useEffect } from 'react'

export function Librarybar(): React.JSX.Element {
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const query = useLibrarybarStore((state) => state.query)
  const refreshGameList = useLibrarybarStore((state) => state.refreshGameList)

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

  return (
    <div className={cn('flex flex-col gap-6 bg-transparent w-full h-full relative group shrink-0')}>
      <div className={cn('p-0 w-full h-full')}>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
      <PositionButton />
    </div>
  )
}
