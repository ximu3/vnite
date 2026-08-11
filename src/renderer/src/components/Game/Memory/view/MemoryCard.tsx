/**
 * Memory card layout summary:
 * - Branches:
 *   - cover + note
 *   - cover only
 *   - note only
 *   - empty
 * - Cover rendering:
 *   - a blurred background fill layer
 *   - a foreground cover layer rendered with `object-fit: contain`
 * - Cover + note sizing:
 *   - `restOverlayRatio = max(0.2, 1 - coverHeightRatio)`
 *   - when `coverHeightRatio >= 0.8`, clamp the rest overlay to `0.2`
 *   - `hoverOverlayRatio = max(restOverlayRatio, min(0.8, requiredOverlayRatio))`
 * - The computed overlay ratios are written to CSS variables and drive both the foreground
 *   image area and the note overlay height.
 */

import { type CSSProperties, useEffect, useRef, useState } from 'react'
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
import type { MemoryViewItem, MemoryViewRuntime, NoteDialogMode } from '../type'

const CARD_NOTE_MIN_RATIO = 0.2
const CARD_NOTE_MAX_RATIO = 0.8

export function MemoryCard({
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
  const [isCoverExist, setIsCoverExist] = useState(true)
  const [coverRefreshKey, setCoverRefreshKey] = useState(0)
  const [requiredOverlayRatio, setRequiredOverlayRatio] = useState(CARD_NOTE_MIN_RATIO)
  const memoryRef = useRef<HTMLDivElement>(null)
  const noteMeasureRef = useRef<HTMLDivElement>(null)
  const openNoteDialog = useMemoryStore((state) => state.openNoteDialog)
  const hasNote = Boolean(note?.trim())
  const hasHoverAction =
    (isCoverExist && !hasNote && showAddNoteHoverButton) ||
    (!isCoverExist && hasNote && showAddCoverHoverButton)
  const { restOverlayRatio, hoverOverlayRatio } = getCoverWithNoteLayout(
    coverHeightRatio,
    requiredOverlayRatio
  )
  const coverWithNoteStyle = {
    '--memory-overlay-rest': `${restOverlayRatio * 100}%`,
    '--memory-overlay-hover': `${hoverOverlayRatio * 100}%`
  } as CSSProperties

  function openMemoryNoteDialog(mode: NoteDialogMode): void {
    openNoteDialog({ memoryId, initialMode: mode })
  }

  // Sync the local cover state when this memory receives a new or updated cover image.
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

  // Measure the rendered note content so the hover overlay can expand to the required height.
  useEffect(() => {
    if (!(isCoverExist && hasNote)) {
      setRequiredOverlayRatio(CARD_NOTE_MIN_RATIO)
      return
    }

    const card = memoryRef.current
    const noteMeasure = noteMeasureRef.current
    if (!card || !noteMeasure) return

    const updateRequiredOverlayRatio = (): void => {
      const cardHeight = card.clientHeight
      if (!cardHeight) return

      setRequiredOverlayRatio(noteMeasure.getBoundingClientRect().height / cardHeight)
    }

    updateRequiredOverlayRatio()

    const observer = new ResizeObserver(updateRequiredOverlayRatio)
    observer.observe(card)
    observer.observe(noteMeasure)

    return (): void => {
      observer.disconnect()
    }
  }, [hasNote, isCoverExist, note])

  function handlePreviewKeyDown(event: React.KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openMemoryNoteDialog('preview')
  }

  function shouldIgnorePreviewClick(event: React.MouseEvent): boolean {
    return Boolean((event.target as HTMLElement).closest('a'))
  }

  function renderDateBadge(): React.JSX.Element {
    return (
      <div
        className={cn(
          'pointer-events-none absolute top-2 right-2 z-20 rounded-md bg-background/85 px-2 py-1 text-[11px] leading-none text-muted-foreground shadow-sm backdrop-blur',
          hasHoverAction && 'transition-opacity group-hover:opacity-0 group-focus-within:opacity-0'
        )}
      >
        {t('{{date, niceDate}}', { date })}
      </div>
    )
  }

  function renderCoverBackgroundImage(keySuffix: string): React.JSX.Element {
    return (
      <GameImage
        key={`memory-cover-background-${memoryId}-${coverRefreshKey}-${keySuffix}`}
        type={`memories/${memoryId}`}
        gameId={gameId}
        className={cn('absolute inset-0 h-full w-full rounded-none shadow-none')}
        fallback={<MemoryCoverFallback onMissing={() => setIsCoverExist(false)} />}
        onError={() => setIsCoverExist(false)}
        onUpdated={() => setIsCoverExist(true)}
      />
    )
  }

  function renderForegroundCoverImage({
    keySuffix,
    className,
    style
  }: {
    keySuffix: string
    className: string
    style?: CSSProperties
  }): React.JSX.Element {
    return (
      <GameImage
        key={`memory-cover-foreground-${memoryId}-${coverRefreshKey}-${keySuffix}`}
        type={`memories/${memoryId}`}
        gameId={gameId}
        className={cn('rounded-none shadow-none', className)}
        // GameImage defaults to object-fit cover, so the foreground cover branch must override
        // the inline image style here to preserve full-image contain positioning.
        style={style}
        fallback={<MemoryCoverFallback onMissing={() => setIsCoverExist(false)} />}
        onError={() => setIsCoverExist(false)}
        onUpdated={() => setIsCoverExist(true)}
      />
    )
  }

  function renderCoverBackgroundBlurOverlay(): React.JSX.Element {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-[1] bg-background/20 backdrop-blur-md'
        )}
      />
    )
  }

  function renderAddNoteButton(): React.JSX.Element {
    return (
      <Button
        type="button"
        size="icon"
        className={cn(
          'pointer-events-none absolute top-2 right-2 z-20 size-8 opacity-0 transition-opacity',
          'group-hover:pointer-events-auto group-hover:opacity-100',
          'group-focus-within:pointer-events-auto group-focus-within:opacity-100'
        )}
        onClick={(event) => {
          event.stopPropagation()
          openMemoryNoteDialog('edit')
        }}
      >
        <span className={cn('icon-[mdi--text-box-plus-outline] size-4')} />
      </Button>
    )
  }

  function renderAddCoverButton(): React.JSX.Element {
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          'pointer-events-none absolute top-2 right-2 z-20 size-8 opacity-0 transition-opacity',
          'group-hover:pointer-events-auto group-hover:opacity-100',
          'group-focus-within:pointer-events-auto group-focus-within:opacity-100'
        )}
        onClick={(event) => {
          event.stopPropagation()
          void runtime.selectCover(memoryId)
        }}
      >
        <span className={cn('icon-[mdi--image-plus] size-4')} />
      </Button>
    )
  }

  function renderCardMarkdownPreview(
    codeBlockMaxHeight: 'prose-pre:max-h-20' | 'prose-pre:max-h-24'
  ): React.JSX.Element {
    return (
      <MarkdownPreview
        value={note}
        renderImages={false}
        className={cn(
          'scrollbar-base-thin h-full overflow-y-auto pr-2 overscroll-contain',
          'prose-headings:my-0.5 prose-h1:text-base prose-h2:text-base prose-h3:text-sm',
          'prose-p:my-1 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0',
          'prose-blockquote:my-0.5 prose-pre:my-1.5',
          codeBlockMaxHeight
        )}
      />
    )
  }

  function renderCardMarkdownPreviewMeasurement(): React.JSX.Element {
    return (
      <MarkdownPreview
        value={note}
        renderImages={false}
        className={cn(
          'pr-2',
          'prose-headings:my-0.5 prose-h1:text-base prose-h2:text-base prose-h3:text-sm',
          'prose-p:my-1 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0',
          'prose-blockquote:my-0.5 prose-pre:my-1.5 prose-pre:max-h-none'
        )}
      />
    )
  }

  function renderCoverWithNote(): React.JSX.Element {
    return (
      <div className={cn('absolute inset-0')} style={coverWithNoteStyle}>
        {renderCoverBackgroundImage('with-note')}
        {renderCoverBackgroundBlurOverlay()}

        <div
          className={cn(
            'absolute inset-x-0 top-0 z-[2] cursor-zoom-in overflow-hidden',
            'transition-[bottom] duration-300 ease-out motion-reduce:transition-none',
            '[bottom:var(--memory-overlay-rest)] group-hover:[bottom:var(--memory-overlay-hover)]'
          )}
          onClick={() => runtime.openImage(memoryId)}
        >
          {renderForegroundCoverImage({
            keySuffix: 'with-note',
            className: cn('h-full w-full'),
            style: {
              objectFit: 'contain',
              objectPosition: 'top center'
            }
          })}
        </div>

        <div
          ref={noteMeasureRef}
          className={cn('pointer-events-none invisible absolute inset-x-0 bottom-0 px-4 py-2')}
        >
          {renderCardMarkdownPreviewMeasurement()}
        </div>

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 cursor-pointer overflow-hidden border-t border-border/60 bg-background/70 px-4 py-2',
            'h-[var(--memory-overlay-rest)] transition-[height,background-color] duration-300 ease-out',
            'group-hover:h-[var(--memory-overlay-hover)] motion-reduce:transition-none',
            'shadow-[0_-8px_24px_rgba(0,0,0,0.12)]'
          )}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (shouldIgnorePreviewClick(event)) return
            openMemoryNoteDialog('preview')
          }}
          onKeyDown={handlePreviewKeyDown}
        >
          {renderCardMarkdownPreview('prose-pre:max-h-20')}
        </div>
      </div>
    )
  }

  function renderCoverOnly(): React.JSX.Element {
    return (
      <div className={cn('absolute inset-0')}>
        {renderCoverBackgroundImage('cover-only')}
        {renderCoverBackgroundBlurOverlay()}

        <div
          className={cn('absolute inset-0 z-[2] cursor-zoom-in overflow-hidden')}
          onClick={() => runtime.openImage(memoryId)}
        >
          {renderForegroundCoverImage({
            keySuffix: 'cover-only',
            className: cn('h-full w-full'),
            style: {
              objectFit: 'contain',
              objectPosition: 'center'
            }
          })}
        </div>

        {showAddNoteHoverButton && renderAddNoteButton()}
      </div>
    )
  }

  function renderNoteOnly(): React.JSX.Element {
    return (
      <>
        {showAddCoverHoverButton && renderAddCoverButton()}

        <div
          className={cn('h-full w-full cursor-pointer overflow-hidden p-4')}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (shouldIgnorePreviewClick(event)) return
            openMemoryNoteDialog('preview')
          }}
          onKeyDown={handlePreviewKeyDown}
        >
          {renderCardMarkdownPreview('prose-pre:max-h-24')}
        </div>
      </>
    )
  }

  function renderEmptyCard(): React.JSX.Element {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground'
        )}
      >
        <span className={cn('icon-[mdi--note-text-outline] size-8')} />
        <div className={cn('flex flex-wrap justify-center gap-2')}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              void runtime.selectCover(memoryId)
            }}
          >
            {t('detail.memory.actions.addCover')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              openMemoryNoteDialog('edit')
            }}
          >
            {t('detail.memory.actions.addText')}
          </Button>
        </div>
      </div>
    )
  }

  function renderCardContent(): React.JSX.Element {
    if (isCoverExist && hasNote) return renderCoverWithNote()
    if (isCoverExist) return renderCoverOnly()
    if (hasNote) return renderNoteOnly()
    return renderEmptyCard()
  }

  return (
    <MemoryItemContextMenu
      item={item}
      runtime={runtime}
      trigger={
        <Card
          ref={memoryRef}
          key={memoryId}
          className={cn(
            'group relative aspect-square w-full gap-0 overflow-hidden rounded-lg p-0 shadow-md img-initial'
          )}
        >
          {pinned && <MemoryPinBadge />}
          {renderDateBadge()}
          {renderCardContent()}
        </Card>
      }
    >
      {/* Cover Image */}
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

      {/* Note */}
      <ContextMenuItem
        onSelect={() => {
          openMemoryNoteDialog('edit')
        }}
      >
        {hasNote ? t('detail.memory.actions.editText') : t('detail.memory.actions.addText')}
      </ContextMenuItem>
      {/* Set As Game Media */}
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

function getCoverWithNoteLayout(
  coverHeightRatio: number | undefined,
  requiredOverlayRatio: number
): { restOverlayRatio: number; hoverOverlayRatio: number } {
  const restOverlayRatio = getRestOverlayRatio(coverHeightRatio)
  const hoverOverlayRatio = Math.max(
    restOverlayRatio,
    Math.min(CARD_NOTE_MAX_RATIO, requiredOverlayRatio)
  )

  return {
    restOverlayRatio,
    hoverOverlayRatio
  }
}

function getRestOverlayRatio(coverHeightRatio: number | undefined): number {
  const normalizedHeightRatio = coverHeightRatio && coverHeightRatio > 0 ? coverHeightRatio : 1

  if (normalizedHeightRatio >= CARD_NOTE_MAX_RATIO) {
    return CARD_NOTE_MIN_RATIO
  }

  return Math.max(CARD_NOTE_MIN_RATIO, 1 - normalizedHeightRatio)
}

function MemoryCoverFallback({ onMissing }: { onMissing: () => void }): React.JSX.Element {
  // Notify the card once the image falls back so it can switch away from cover-based layouts.
  useEffect(() => {
    onMissing()
  }, [onMissing])

  return <div />
}
