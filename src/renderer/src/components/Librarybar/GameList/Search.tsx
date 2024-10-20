import { useGameIndexManager } from '~/hooks'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'

export function Search({ query }: { query: string }): JSX.Element {
  const { search } = useGameIndexManager()
  const games = search(query)
  return (
    <div className={cn('w-full h-full flex flex-col gap-1')}>
      {games.map((game) => (
        <GameNav key={game} gameId={game} groupId={'0'} />
      ))}
    </div>
  )
}
