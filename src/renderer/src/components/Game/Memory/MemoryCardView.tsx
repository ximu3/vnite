import type { gameDoc } from '@appTypes/models/game'
import { cn } from '~/utils'
import { MemoryCard } from './MemoryCard'

type MemoryList = gameDoc['memory']['memoryList']

export function MemoryCardView({
  gameId,
  memoryIds,
  memoryList,
  onDelete,
  onSaveNote
}: {
  gameId: string
  memoryIds: string[]
  memoryList: MemoryList
  onDelete: (memoryId: string) => void
  onSaveNote: (memoryId: string, note: string) => Promise<void>
}): React.JSX.Element {
  return (
    <div
      className={cn('grid w-full grid-cols-[repeat(auto-fill,minmax(min(14rem,100%),1fr))] gap-5')}
    >
      {memoryIds.map((id) => {
        const memory = memoryList[id]

        if (!memory) {
          return null
        }

        return (
          <MemoryCard
            key={`memory-${id}`}
            gameId={gameId}
            memoryId={id}
            handleDelete={() => onDelete(id)}
            note={memory.note}
            date={memory.date}
            saveNote={(note) => onSaveNote(id, note)}
          />
        )
      })}
    </div>
  )
}
