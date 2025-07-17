import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { GameList } from './GameList'
import { PositionButton } from './PositionButton'
import { useLibrarybarStore } from './store'

export function Librarybar(): React.JSX.Element {
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const query = useLibrarybarStore((state) => state.query)

  console.warn(`[DEBUG] Librarybar`)

  return (
    <div className={cn('flex flex-col gap-6 bg-transparent w-[270px] h-full relative group')}>
      <div className={cn('p-0 w-full h-full')}>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
      <PositionButton />
    </div>
  )
}
