import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { cn } from '~/utils'
import { MemoryItemContextMenu } from '../components/MemoryItemContextMenu'
import { MemoryPinBadge } from '../components/MemoryPinBadge'
import type { MemoryViewItem, MemoryViewProps, MemoryViewRuntime } from '../type'

const MASONRY_GAP_PX = 6
const MIN_COLUMN_WIDTH_PX = 120

export function MemoryMasonryView({
  items,
  runtime,
  columnWidth
}: MemoryViewProps & {
  columnWidth: number
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateContainerWidth = (): void => {
      setContainerWidth(container.clientWidth)
    }

    updateContainerWidth()
    const observer = new ResizeObserver(updateContainerWidth)
    observer.observe(container)

    return (): void => observer.disconnect()
  }, [])

  const columnCount = useMemo(() => {
    const safeColumnWidth = Math.max(MIN_COLUMN_WIDTH_PX, columnWidth)
    if (containerWidth <= 0) return 1

    return Math.max(
      1,
      Math.floor((containerWidth + MASONRY_GAP_PX) / (safeColumnWidth + MASONRY_GAP_PX))
    )
  }, [columnWidth, containerWidth])

  const columns = useMemo(() => {
    const columnItemLists: MemoryViewItem[][] = Array.from({ length: columnCount }, () => [])
    const columnHeights = Array.from({ length: columnCount }, () => 0)
    const actualColumnWidth =
      columnCount > 0
        ? (containerWidth - MASONRY_GAP_PX * (columnCount - 1)) / columnCount
        : columnWidth
    const normalizedGapHeight = actualColumnWidth > 0 ? MASONRY_GAP_PX / actualColumnWidth : 0

    for (const item of items) {
      const heightRatio = item.coverHeightRatio
      if (!heightRatio || heightRatio <= 0) continue

      const targetColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      columnItemLists[targetColumnIndex].push(item)
      columnHeights[targetColumnIndex] += heightRatio + normalizedGapHeight
    }

    return columnItemLists
  }, [columnCount, columnWidth, containerWidth, items])

  return (
    <div ref={containerRef} className={cn('flex w-full')} style={{ gap: MASONRY_GAP_PX }}>
      {columns.map((items, columnIndex) => (
        <div
          key={`memory-masonry-column-${columnIndex}`}
          className={cn('flex min-w-0 flex-1 flex-col')}
          style={{ gap: MASONRY_GAP_PX }}
        >
          {items.map((item) => (
            <MemoryMasonryItem
              key={`memory-masonry-${item.memoryId}`}
              item={item}
              runtime={runtime}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function MemoryMasonryItem({
  item,
  runtime
}: {
  item: MemoryViewItem
  runtime: MemoryViewRuntime
}): React.JSX.Element {
  const { memoryId, pinned, coverHeightRatio } = item
  const { gameId } = runtime
  const { t } = useTranslation('game')

  return (
    <MemoryItemContextMenu
      item={item}
      runtime={runtime}
      trigger={
        <div
          className={cn(
            'relative block w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0'
          )}
          style={{ aspectRatio: `1 / ${coverHeightRatio}` }}
          onClick={() => runtime.openImage(memoryId)}
        >
          {pinned && <MemoryPinBadge />}
          <GameImage
            type={`memories/${memoryId}`}
            gameId={gameId}
            className={cn('block h-full w-full shadow-none')}
            fallback={<div />}
            loading="lazy"
            decoding="async"
            onError={() => runtime.markCoverMissing(memoryId)}
          />
        </div>
      }
    >
      <ContextMenuItem onSelect={() => void runtime.selectCover(memoryId)}>
        {t('detail.memory.actions.changeCover')}
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => void runtime.resizeCover(memoryId)}>
        {t('detail.memory.actions.adjustCover')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t('detail.memory.setAs.title')}</ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent>
              <ContextMenuItem onSelect={() => void runtime.setCoverAsGameMedia(memoryId, 'cover')}>
                {t('detail.memory.setAs.cover')}
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() => void runtime.setCoverAsGameMedia(memoryId, 'background')}
              >
                {t('detail.memory.setAs.background')}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      </ContextMenuGroup>
    </MemoryItemContextMenu>
  )
}
