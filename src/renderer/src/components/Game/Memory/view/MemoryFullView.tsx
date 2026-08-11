import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@ui/button'
import { Card } from '@ui/card'
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
import { eventBus } from '~/app/events'
import { cn } from '~/utils'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { MemoryItemContextMenu } from '../components/MemoryItemContextMenu'
import { MemoryPinBadge } from '../components/MemoryPinBadge'
import { useMemoryStore } from '../store'
import type { MemoryViewItem, MemoryViewProps, MemoryViewRuntime } from '../type'

const FULL_VIEW_GAP_PX = 20
const FULL_VIEW_ROW_HEIGHT_PX = 1

export function MemoryFullView({
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
      className={cn('grid w-full items-start')}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${columnWidth}px, 100%), 1fr))`,
        gridAutoRows: FULL_VIEW_ROW_HEIGHT_PX,
        gap: FULL_VIEW_GAP_PX
      }}
    >
      {items.map((item) => {
        return (
          <MasonryGridItem key={`memory-full-${item.memoryId}`}>
            <MemoryFullCard
              item={item}
              runtime={runtime}
              showAddCoverHoverButton={showAddCoverHoverButton}
              showAddNoteHoverButton={showAddNoteHoverButton}
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
  item,
  runtime,
  showAddCoverHoverButton,
  showAddNoteHoverButton
}: {
  item: MemoryViewItem
  runtime: MemoryViewRuntime
  showAddCoverHoverButton: boolean
  showAddNoteHoverButton: boolean
}): React.JSX.Element {
  const { memoryId, note, date, pinned, coverHeightRatio } = item
  const { gameId } = runtime
  const { t } = useTranslation('game')
  const [isCoverExist, setIsCoverExist] = useState(Boolean(coverHeightRatio))
  const [coverRefreshKey, setCoverRefreshKey] = useState(0)
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

  function renderAddCoverButton(iconOnly = true): React.JSX.Element {
    return (
      <Button
        type="button"
        variant="secondary"
        size={iconOnly ? 'icon' : 'sm'}
        className={cn(iconOnly && 'size-8')}
        onClick={(event) => {
          event.stopPropagation()
          void runtime.selectCover(memoryId)
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
    <MemoryItemContextMenu
      item={item}
      runtime={runtime}
      trigger={
        <Card
          className={cn(
            'group relative w-full gap-0 overflow-hidden rounded-lg p-0 shadow-md img-initial'
          )}
        >
          {pinned && <MemoryPinBadge />}
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
                  runtime.markCoverMissing(memoryId)
                }}
                onClick={() => runtime.openImage(memoryId)}
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
      }
    >
      <ContextMenuItem onSelect={() => void runtime.selectCover(memoryId)}>
        {isCoverExist
          ? t('detail.memory.actions.changeCover')
          : t('detail.memory.actions.addCover')}
      </ContextMenuItem>
      {isCoverExist && (
        <ContextMenuItem onSelect={() => void runtime.resizeCover(memoryId)}>
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
                  <ContextMenuItem
                    onSelect={() => void runtime.setCoverAsGameMedia(memoryId, 'cover')}
                  >
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
        </>
      )}
    </MemoryItemContextMenu>
  )
}
