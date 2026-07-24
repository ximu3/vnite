import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { gameDoc } from '@appTypes/models/game'
import { Button } from '@ui/button'
import { Card } from '@ui/card'
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
import { eventBus } from '~/app/events'
import { ipcManager } from '~/app/ipc'
import { useLightStore } from '~/pages/Light'
import { cn } from '~/utils'
import { useGameDetailStore } from '../store'
import { openLargeMemoryImage } from '../utils'
import { MarkdownPreview } from './MarkdownPreview'
import type { MemoryMasonryItemInfo } from './MemoryMasonryView'
import { exportAllMemories } from './memoryExport'
import { useMemoryStore } from './store'

const FULL_VIEW_GAP_PX = 20
const FULL_VIEW_ROW_HEIGHT_PX = 1

type MemoryList = gameDoc['memory']['memoryList']

export function MemoryFullView({
  gameId,
  memoryIds,
  viewerMemoryIds,
  memoryList,
  masonryItemByMemoryId,
  columnWidth,
  showAddCoverHoverButton,
  showAddNoteHoverButton,
  onCoverMissing,
  onDelete
}: {
  gameId: string
  memoryIds: string[]
  viewerMemoryIds: string[]
  memoryList: MemoryList
  masonryItemByMemoryId: Record<string, MemoryMasonryItemInfo>
  columnWidth: number
  showAddCoverHoverButton: boolean
  showAddNoteHoverButton: boolean
  onCoverMissing: (memoryId: string) => void
  onDelete: (memoryId: string) => Promise<void>
}): React.JSX.Element {
  return (
    <div
      className={cn('grid w-full items-start')}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${columnWidth}px, 100%), 1fr))`,
        gridAutoRows: FULL_VIEW_ROW_HEIGHT_PX,
        gap: FULL_VIEW_GAP_PX
      }}
    >
      {memoryIds.map((memoryId) => {
        const memory = memoryList[memoryId]
        if (!memory) return null

        return (
          <MasonryGridItem key={`memory-full-${memoryId}`}>
            <MemoryFullCard
              gameId={gameId}
              memoryId={memoryId}
              viewerMemoryIds={viewerMemoryIds}
              note={memory.note}
              date={memory.date}
              coverHeightRatio={masonryItemByMemoryId[memoryId]?.heightRatio}
              showAddCoverHoverButton={showAddCoverHoverButton}
              showAddNoteHoverButton={showAddNoteHoverButton}
              onCoverMissing={() => onCoverMissing(memoryId)}
              onDelete={() => onDelete(memoryId)}
            />
          </MasonryGridItem>
        )
      })}
    </div>
  )
}

function MasonryGridItem({ children }: { children: React.ReactNode }): React.JSX.Element {
  const itemRef = useRef<HTMLDivElement>(null)
  const [rowSpan, setRowSpan] = useState(1)

  useLayoutEffect(() => {
    const item = itemRef.current
    if (!item) return

    const updateRowSpan = (): void => {
      const height = item.getBoundingClientRect().height
      const nextRowSpan = Math.max(
        1,
        Math.ceil((height + FULL_VIEW_GAP_PX) / (FULL_VIEW_ROW_HEIGHT_PX + FULL_VIEW_GAP_PX))
      )
      setRowSpan((current) => (current === nextRowSpan ? current : nextRowSpan))
    }

    updateRowSpan()
    const observer = new ResizeObserver(updateRowSpan)
    observer.observe(item)

    return (): void => observer.disconnect()
  }, [])

  return (
    <div className={cn('min-w-0')} style={{ gridRowEnd: `span ${rowSpan}` }}>
      <div ref={itemRef}>{children}</div>
    </div>
  )
}

function MemoryFullCard({
  gameId,
  memoryId,
  viewerMemoryIds,
  note,
  date,
  coverHeightRatio,
  showAddCoverHoverButton,
  showAddNoteHoverButton,
  onCoverMissing,
  onDelete
}: {
  gameId: string
  memoryId: string
  viewerMemoryIds: string[]
  note: string
  date: string
  coverHeightRatio?: number
  showAddCoverHoverButton: boolean
  showAddNoteHoverButton: boolean
  onCoverMissing: () => void
  onDelete: () => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [isCoverExist, setIsCoverExist] = useState(Boolean(coverHeightRatio))
  const [coverRefreshKey, setCoverRefreshKey] = useState(0)
  const refreshLight = useLightStore((state) => state.refresh)
  const openImageViewer = useGameDetailStore((state) => state.openImageViewer)
  const openCropDialog = useMemoryStore((state) => state.openCropDialog)
  const openNoteDialog = useMemoryStore((state) => state.openNoteDialog)
  const hasNote = Boolean(note?.trim())
  const showAddCoverHoverAction = !isCoverExist && hasNote && showAddCoverHoverButton
  const showAddNoteHoverAction = isCoverExist && !hasNote && showAddNoteHoverButton
  const normalizedCoverHeightRatio = coverHeightRatio && coverHeightRatio > 0 ? coverHeightRatio : 1

  useEffect(() => {
    setIsCoverExist(Boolean(coverHeightRatio))
  }, [coverHeightRatio])

  useEffect(() => {
    const handleMemoryImageAvailable = ({
      gameId: changedGameId,
      memoryId: changedMemoryId
    }: {
      gameId: string
      memoryId: string
    }): void => {
      if (changedGameId !== gameId || changedMemoryId !== memoryId) return

      setIsCoverExist(true)
      setCoverRefreshKey((current) => current + 1)
    }

    const unsubscribeMemoryCreated = eventBus.on('game:memory-created', handleMemoryImageAvailable)
    const unsubscribeMemoryCoverUpdated = eventBus.on(
      'game:memory-cover-updated',
      handleMemoryImageAvailable
    )

    return (): void => {
      unsubscribeMemoryCreated()
      unsubscribeMemoryCoverUpdated()
    }
  }, [gameId, memoryId])

  async function handleCoverSelect(): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      openCropDialog({
        gameId,
        memoryId,
        imagePath: filePath,
        imageSource: 'selected-file'
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
        imageSource: 'existing-cover'
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

  function renderAddCoverButton(iconOnly = true): React.JSX.Element {
    return (
      <Button
        type="button"
        variant="secondary"
        size={iconOnly ? 'icon' : 'sm'}
        className={cn(iconOnly && 'size-8')}
        onClick={(event) => {
          event.stopPropagation()
          void handleCoverSelect()
        }}
      >
        {iconOnly ? (
          <span className={cn('icon-[mdi--image-plus] size-4')} />
        ) : (
          t('detail.memory.actions.addCover')
        )}
      </Button>
    )
  }

  function renderAddNoteButton(iconOnly = true): React.JSX.Element {
    return (
      <Button
        type="button"
        size={iconOnly ? 'icon' : 'sm'}
        className={cn(iconOnly && 'size-8')}
        onClick={(event) => {
          event.stopPropagation()
          openNoteDialog({ memoryId, initialMode: 'edit' })
        }}
      >
        {iconOnly ? (
          <span className={cn('icon-[mdi--text-box-plus-outline] size-4')} />
        ) : (
          t('detail.memory.actions.addText')
        )}
      </Button>
    )
  }

  function renderMissingContentActions(): React.JSX.Element | null {
    if (!showAddCoverHoverAction && !showAddNoteHoverAction) return null

    return (
      <div
        className={cn(
          'pointer-events-none absolute top-2 right-2 z-20 flex gap-2 opacity-0 transition-opacity',
          'group-hover:pointer-events-auto group-hover:opacity-100',
          'group-focus-within:pointer-events-auto group-focus-within:opacity-100'
        )}
      >
        {showAddCoverHoverAction && renderAddCoverButton()}
        {showAddNoteHoverAction && renderAddNoteButton()}
      </div>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn(
            'group relative w-full gap-0 overflow-hidden rounded-lg p-0 shadow-md img-initial'
          )}
        >
          {renderMissingContentActions()}

          {isCoverExist && (
            <div
              className={cn('w-full overflow-hidden')}
              style={{ aspectRatio: `1 / ${normalizedCoverHeightRatio}` }}
            >
              <GameImage
                key={`memory-full-cover-${memoryId}-${coverRefreshKey}`}
                type={`memories/${memoryId}`}
                gameId={gameId}
                fit="contain"
                className={cn('block h-full w-full rounded-none shadow-none cursor-zoom-in')}
                fallback={<div />}
                loading="lazy"
                decoding="async"
                onError={() => {
                  setIsCoverExist(false)
                  onCoverMissing()
                }}
                onClick={() =>
                  openLargeMemoryImage({
                    gameId,
                    memoryId,
                    memoryIds: viewerMemoryIds,
                    openImageViewer
                  })
                }
                onUpdated={() => setIsCoverExist(true)}
              />
            </div>
          )}

          {hasNote && (
            <div className={cn('px-5 py-4', isCoverExist && 'border-t border-border/60')}>
              <MarkdownPreview
                value={note}
                renderImages={false}
                className={cn(
                  'select-text pr-2',
                  'prose-headings:my-0.5 prose-h1:text-base prose-h2:text-base prose-h3:text-sm',
                  'prose-p:my-1 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0',
                  'prose-blockquote:my-0.5 prose-pre:my-1.5 prose-pre:max-h-none'
                )}
              />
            </div>
          )}

          {!isCoverExist && !hasNote && (
            <div
              className={cn(
                'flex min-h-36 flex-col items-center justify-center gap-3 p-5 text-center text-sm text-muted-foreground'
              )}
            >
              <span className={cn('icon-[mdi--note-text-outline] size-8')} />
              <div className={cn('flex flex-wrap justify-center gap-2')}>
                {renderAddCoverButton(false)}
                {renderAddNoteButton(false)}
              </div>
            </div>
          )}

          <div
            className={cn(
              'border-t border-border/60 px-5 py-3 text-right text-xs text-muted-foreground'
            )}
          >
            {t('{{date, niceDate}}', { date })}
          </div>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => void handleCoverSelect()}>
          {isCoverExist
            ? t('detail.memory.actions.changeCover')
            : t('detail.memory.actions.addCover')}
        </ContextMenuItem>
        {isCoverExist && (
          <ContextMenuItem onSelect={() => void handleResize()}>
            {t('detail.memory.actions.adjustCover')}
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => openNoteDialog({ memoryId, initialMode: 'edit' })}>
          {hasNote ? t('detail.memory.actions.editText') : t('detail.memory.actions.addText')}
        </ContextMenuItem>

        {isCoverExist && (
          <>
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
          </>
        )}

        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => void exportAllMemories(gameId)}>
          {t('detail.memory.export.all')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => void onDelete()}>
          {t('detail.memory.actions.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
