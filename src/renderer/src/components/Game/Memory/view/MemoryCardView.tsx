import { cn } from '~/utils'
import type { MemoryViewProps } from '../type'
import { MemoryCard } from './MemoryCard'

export function MemoryCardView({
  items,
  runtime,
  columnWidth,
  showAddCoverHoverButton,
  showAddNoteHoverButton
}: MemoryViewProps & {
  columnWidth: number
  showAddCoverHoverButton: boolean
  showAddNoteHoverButton: boolean
}): React.JSX.Element {
  return (
    <div
      className={cn('grid w-full gap-5')}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${columnWidth}px, 100%), 1fr))`
      }}
    >
      {items.map((item) => {
        return (
          <MemoryCard
            key={`memory-${item.memoryId}`}
            item={item}
            runtime={runtime}
            showAddCoverHoverButton={showAddCoverHoverButton}
            showAddNoteHoverButton={showAddNoteHoverButton}
          />
        )
      })}
    </div>
  )
}
