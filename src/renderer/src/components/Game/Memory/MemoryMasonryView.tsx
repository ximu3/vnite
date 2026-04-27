import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useLightStore } from '~/pages/Light'
import { cn } from '~/utils'
import { useGameDetailStore } from '../store'
import { openLargeMemoryImage } from '../utils'
import { useMemoryStore } from './store'

const MASONRY_GAP_PX = 6
const MIN_COLUMN_WIDTH_PX = 120

export type MemoryMasonryItemInfo = { heightRatio: number }
export type MasonryItem = { memoryId: string; itemInfo: MemoryMasonryItemInfo }

export function MemoryMasonryView({
  gameId,
  memoryIds,
  masonryItemByMemoryId,
  columnWidth,
  onCoverMissing,
  onDelete
}: {
  gameId: string
  memoryIds: string[]
  masonryItemByMemoryId: Record<string, MemoryMasonryItemInfo>
  columnWidth: number
  onCoverMissing: (memoryId: string) => void
  onDelete: (memoryId: string) => Promise<void>
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
    const columnItemLists: MasonryItem[][] = Array.from({ length: columnCount }, () => [])
    const columnHeights = Array.from({ length: columnCount }, () => 0)
    const actualColumnWidth =
      columnCount > 0
        ? (containerWidth - MASONRY_GAP_PX * (columnCount - 1)) / columnCount
        : columnWidth
    const normalizedGapHeight = actualColumnWidth > 0 ? MASONRY_GAP_PX / actualColumnWidth : 0

    for (const memoryId of memoryIds) {
      const itemInfo = masonryItemByMemoryId[memoryId]
      if (!itemInfo || itemInfo.heightRatio <= 0) continue

      const targetColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      columnItemLists[targetColumnIndex].push({ memoryId, itemInfo })
      columnHeights[targetColumnIndex] += itemInfo.heightRatio + normalizedGapHeight
    }

    return columnItemLists
  }, [columnCount, columnWidth, containerWidth, masonryItemByMemoryId, memoryIds])

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
              gameId={gameId}
              memoryId={item.memoryId}
              itemInfo={item.itemInfo}
              onCoverMissing={onCoverMissing}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function MemoryMasonryItem({
  gameId,
  memoryId,
  itemInfo,
  onCoverMissing,
  onDelete
}: {
  gameId: string
  memoryId: string
  itemInfo: MemoryMasonryItemInfo
  onCoverMissing: (memoryId: string) => void
  onDelete: (memoryId: string) => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const refreshLight = useLightStore((state) => state.refresh)
  const openImageViewerDialog = useGameDetailStore((state) => state.openImageViewerDialog)
  const openCropDialog = useMemoryStore((state) => state.openCropDialog)

  async function handleCoverSelect(): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      openCropDialog({
        gameId,
        memoryId,
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.selectFileError', { error }))
    }
  }

  async function handleResize(): Promise<void> {
    try {
      const currentPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
      if (!currentPath) {
        toast.error(t('detail.memory.notifications.imageNotFound'))
        return
      }

      openCropDialog({
        gameId,
        memoryId,
        imagePath: currentPath,
        isResizing: true
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.getImageError', { error }))
    }
  }

  async function handleSetAs(type: 'cover' | 'background'): Promise<void> {
    try {
      const coverPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
      if (!coverPath) {
        toast.error(t('detail.memory.notifications.imageNotFound'))
        return
      }

      await ipcManager.invoke('game:set-image', gameId, type, coverPath)
      refreshLight()
      toast.success(
        t(
          type === 'cover'
            ? 'detail.memory.notifications.setCoverSuccess'
            : 'detail.memory.notifications.setBackgroundSuccess'
        )
      )
    } catch (error) {
      toast.error(
        t(
          type === 'cover'
            ? 'detail.memory.notifications.setCoverError'
            : 'detail.memory.notifications.setBackgroundError',
          { error }
        )
      )
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn('block w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0')}
          style={{ aspectRatio: `1 / ${itemInfo.heightRatio}` }}
          onClick={() => void openLargeMemoryImage({ gameId, memoryId, openImageViewerDialog })}
        >
          <GameImage
            type={`memories/${memoryId}`}
            gameId={gameId}
            className={cn('block h-full w-full shadow-none')}
            fallback={<div />}
            loading="lazy"
            decoding="async"
            onError={() => onCoverMissing(memoryId)}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => void handleCoverSelect()}>
          {t('detail.memory.actions.changeCover')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => void handleResize()}>
          {t('detail.memory.actions.adjustCover')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{t('detail.memory.setAs.title')}</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuItem onSelect={() => void handleSetAs('cover')}>
                  {t('detail.memory.setAs.cover')}
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => void handleSetAs('background')}>
                  {t('detail.memory.setAs.background')}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => void onDelete(memoryId)}>
          {t('detail.memory.actions.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
