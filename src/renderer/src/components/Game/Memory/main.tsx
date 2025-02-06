import { cn } from '~/utils'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { MemoryCard } from './MemoryCard'

export function Memory({ gameId }: { gameId: string }): JSX.Element {
  const [memoryList] = useDBSyncedState({}, `games/${gameId}/memory.json`, ['memoryList'])
  async function addMemory(): Promise<void> {
    await ipcInvoke('add-memory', gameId)
  }

  return (
    <div className={cn('w-full h-full min-h-[22vh] flex flex-col pt-2 gap-5')}>
      <div>
        <Button variant="default" size={'icon'} onClick={addMemory}>
          <span className={cn('icon-[mdi--add] w-6 h-6')}></span>
        </Button>
      </div>
      <div className={cn('flex flex-wrap gap-5 w-full')}>
        {/* Sort by date in descending order */}
        {Object.entries(memoryList as Record<string, { date: string }>)
          .sort(([, a], [, b]) => b.date.localeCompare(a.date))
          .map(([id]) => (
            <MemoryCard key={id} gameId={gameId} memoryId={id} />
          ))}
      </div>
    </div>
  )
}
