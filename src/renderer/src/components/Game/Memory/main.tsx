import { cn } from '~/utils'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { useGameState } from '~/hooks'
import { MemoryCard } from './MemoryCard'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

export function Memory({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [memoryList, setMemoryList, saveMemoryList, setMemoryListAndSave] = useGameState(
    gameId,
    'memory.memoryList',
    true
  )
  const [sortedMemoryIds, setSortedMemoryIds] = useState<string[]>([])

  async function addMemory(): Promise<void> {
    await ipcManager.invoke('game:add-memory', gameId)
  }

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
        await setMemoryListAndSave(newMemoryList)

        // Finally, perform a back-end delete operation
        await ipcManager.invoke('game:delete-memory', gameId, memoryId)
      },
      {
        loading: t('detail.memory.notifications.deleting'),
        success: t('detail.memory.notifications.deleteSuccess'),
        error: (err) => t('detail.memory.notifications.deleteError', { error: err })
      }
    )
  }

  async function setNote(memoryId: string, note: string): Promise<void> {
    const newMemoryList = {
      ...memoryList,
      [memoryId]: {
        ...memoryList[memoryId],
        note
      }
    }
    setMemoryList(newMemoryList)
  }

  return (
    <div className={cn('w-full h-full min-h-[22vh] flex flex-col pt-2 gap-5')}>
      <div>
        <Button variant="default" size={'icon'} onClick={addMemory}>
          <span className={cn('icon-[mdi--add] w-6 h-6')}></span>
        </Button>
      </div>
      <div className="grid w-full grid-cols-3 gap-x-5 gap-y-5">
        <div className="flex flex-col gap-5">
          {sortedMemoryIds
            .filter((_, i) => i % 3 === 0)
            .map((id) => (
              <MemoryCard
                key={`memory-${id}`}
                gameId={gameId}
                memoryId={id}
                handleDelete={() => handleDelete(id)}
                note={memoryList[id]?.note}
                date={memoryList[id]?.date}
                setNote={(note) => setNote(id, note)}
                saveNote={saveMemoryList}
              />
            ))}
        </div>

        <div className="flex flex-col gap-5">
          {sortedMemoryIds
            .filter((_, i) => i % 3 === 1)
            .map((id) => (
              <MemoryCard
                key={`memory-${id}`}
                gameId={gameId}
                memoryId={id}
                handleDelete={() => handleDelete(id)}
                note={memoryList[id]?.note}
                date={memoryList[id]?.date}
                setNote={(note) => setNote(id, note)}
                saveNote={saveMemoryList}
              />
            ))}
        </div>

        <div className="flex flex-col gap-5">
          {sortedMemoryIds
            .filter((_, i) => i % 3 === 2)
            .map((id) => (
              <MemoryCard
                key={`memory-${id}`}
                gameId={gameId}
                memoryId={id}
                handleDelete={() => handleDelete(id)}
                note={memoryList[id]?.note}
                date={memoryList[id]?.date}
                setNote={(note) => setNote(id, note)}
                saveNote={saveMemoryList}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
