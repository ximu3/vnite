import { cn } from '~/utils'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { ipcInvoke } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { MemoryCard } from './MemoryCard'
import { useState, useEffect } from 'react'

export function Memory({ gameId }: { gameId: string }): JSX.Element {
  const [memoryList, setMemoryList] = useDBSyncedState({}, `games/${gameId}/memory.json`, [
    'memoryList'
  ])
  async function addMemory(): Promise<void> {
    await ipcInvoke('add-memory', gameId)
  }
  const [sortedMemoryIds, setSortedMemoryIds] = useState<string[]>([])

  useEffect(() => {
    // Recalculate sortedMemoryIds when memoryList is updated.
    const ids = Object.keys(memoryList)
      .filter((id) => memoryList[id] && memoryList[id].date) // Filter out invalid data
      .sort((a, b) => memoryList[b].date.localeCompare(memoryList[a].date))
    setSortedMemoryIds(ids)
  }, [memoryList])

  async function handleDelete(memoryId: string): Promise<void> {
    toast.promise(
      async () => {
        // Remove first from sortedMemoryIds
        setSortedMemoryIds((prev) => prev.filter((id) => id !== memoryId))

        // and then update the memoryList
        const newMemoryList = { ...memoryList }
        delete newMemoryList[memoryId]
        await setMemoryList(newMemoryList)

        // Finally, perform a back-end delete operation
        await ipcInvoke('delete-memory', gameId, memoryId)
      },
      {
        loading: '正在删除...',
        success: '删除成功',
        error: (err) => {
          // Restore state on error
          setSortedMemoryIds((prev) =>
            [...prev, memoryId].sort((a, b) => memoryList[b].date.localeCompare(memoryList[a].date))
          )
          return `删除失败: ${err}`
        }
      }
    )
  }

  async function setNote(memoryId: string, note: string): Promise<void> {
    const newMemoryList = { ...memoryList }
    newMemoryList[memoryId].note = note
    await setMemoryList(newMemoryList)
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
        {sortedMemoryIds.map((id) => (
          <MemoryCard
            key={`memory-${id}`}
            gameId={gameId}
            memoryId={id}
            handleDelete={() => handleDelete(id)}
            note={memoryList[id].note}
            date={memoryList[id].date}
            setNote={(note) => setNote(id, note)}
          />
        ))}
      </div>
    </div>
  )
}
