import type { gameDoc } from '@appTypes/models/game'
import { cn } from '~/utils'
import { MemoryCard } from './MemoryCard'
import type { MemoryMasonryItemInfo } from './MemoryMasonryView'

type MemoryList = gameDoc['memory']['memoryList']

export function MemoryCardView({
  gameId,
  memoryIds,
  viewerMemoryIds,
  memoryList,
  masonryItemByMemoryId,
  columnWidth,
  onDelete
}: {
  gameId: string
  memoryIds: string[]
  viewerMemoryIds: string[]
  memoryList: MemoryList
  masonryItemByMemoryId: Record<string, MemoryMasonryItemInfo>
  columnWidth: number
  onDelete: (memoryId: string) => void
}): React.JSX.Element {
  return (
    <div
      className={cn('grid w-full gap-5')}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${columnWidth}px, 100%), 1fr))`
      }}
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
            viewerMemoryIds={viewerMemoryIds}
            handleDelete={() => onDelete(id)}
            note={memory.note}
            date={memory.date}
            coverHeightRatio={masonryItemByMemoryId[id]?.heightRatio}
          />
        )
      })}
    </div>
  )
}
