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
import html2canvas from 'html2canvas-pro'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useGameState } from '~/hooks'
import { useLightStore } from '~/pages/Light'
import { cn, formatDateToISO } from '~/utils'
import { CropDialog } from '../Config/Properties/Media/CropDialog'
import { useGameDetailStore } from '../store'
import { MarkdownPreview } from './MarkdownPreview'
import { NoteDialog, type NoteDialogMode } from './NoteDialog'

export function MemoryCard({
  gameId,
  memoryId,
  handleDelete,
  note,
  date,
  saveNote
}: {
  gameId: string
  memoryId: string
  handleDelete: () => void
  note: string
  date: string
  saveNote: (note: string) => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [noteDialogMode, setNoteDialogMode] = useState<NoteDialogMode>('edit')
  const [cropDialogState, setCropDialogState] = useState<{
    isOpen: boolean
    type: string
    imagePath: string | null
    isResizing: boolean
  }>({
    isOpen: false,
    type: '',
    imagePath: null,
    isResizing: false
  })
  const [isCoverExist, setIsCoverExist] = useState(true)
  const [gameName] = useGameState(gameId, 'metadata.name')
  const memoryRef = useRef<HTMLDivElement>(null)
  const refreshLight = useLightStore((state) => state.refresh)
  const openImageViewerDialog = useGameDetailStore((state) => state.openImageViewerDialog)
  const hasNote = Boolean(note?.trim())

  function openNoteDialog(mode: NoteDialogMode): void {
    setNoteDialogMode(mode)
    setIsNoteDialogOpen(true)
  }

  function handleCropComplete(filePath: string): void {
    ipcManager.invoke('game:update-memory-cover', gameId, memoryId, filePath)
    setIsCoverExist(true)
    setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })
  }

  function handlePreviewKeyDown(event: React.KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openNoteDialog('preview')
  }

  function shouldIgnorePreviewClick(event: React.MouseEvent): boolean {
    return Boolean((event.target as HTMLElement).closest('a'))
  }

  async function handleViewLargeImage(): Promise<void> {
    try {
      const currentPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
      if (!currentPath) {
        toast.error(t('detail.memory.notifications.imageNotFound'))
        return
      }
      openImageViewerDialog(currentPath)
    } catch (error) {
      toast.error(t('detail.memory.notifications.getImageError', { error }))
    }
  }

  async function handleCoverSelect(): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      setCropDialogState({
        isOpen: true,
        type: '',
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.selectFileError', { error }))
    }
  }

  async function handleResize(): Promise<void> {
    try {
      // Get current image path
      const currentPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
      if (!currentPath) {
        toast.error(t('detail.memory.notifications.imageNotFound'))
        return
      }

      setCropDialogState({
        isOpen: true,
        type: '',
        imagePath: currentPath,
        isResizing: true
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.getImageError', { error }))
    }
  }

  const handleExportAsImage = async (): Promise<void> => {
    if (memoryRef.current) {
      try {
        // Create a clone of the original element
        const clone = memoryRef.current.cloneNode(true) as HTMLElement

        // Setting the style of a cloned element
        clone.style.width = '800px'
        clone.style.position = 'absolute'
        clone.style.left = '-9999px'

        // Adds the cloned element to the body
        document.body.appendChild(clone)

        const canvas = await html2canvas(clone, {
          backgroundColor: null,
          allowTaint: true,
          useCORS: true,
          removeContainer: true,
          scale: 2
        })

        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `${gameName}-memory-${formatDateToISO(date)}.png`
        link.click()
      } finally {
        // Remove temporarily cloned nodes
        const clone = document.querySelector('[style*="left: -9999px"]')
        if (clone) {
          document.body.removeChild(clone)
        }
      }
    }
  }

  const handleExportAsImageToClipboard = async (): Promise<void> => {
    if (memoryRef.current) {
      try {
        // Creating a Clone Node
        const clone = memoryRef.current.cloneNode(true) as HTMLElement
        clone.style.width = '800px'
        clone.style.position = 'absolute'
        clone.style.left = '-9999px'
        document.body.appendChild(clone)

        const canvas = await html2canvas(clone, {
          backgroundColor: null,
          allowTaint: true,
          useCORS: true,
          removeContainer: true,
          scale: 2
        })

        // Converting canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create blob from canvas')
          }

          const clipboardItem = new ClipboardItem({
            [blob.type]: blob
          })

          navigator.clipboard
            .write([clipboardItem])
            .then(() => {
              toast.success(t('detail.memory.notifications.imageCopied'))
            })
            .catch((error) => {
              toast.error(t('detail.memory.notifications.imageCopyError', { error }))
            })
        }, 'image/png')
      } finally {
        // Remove temporarily cloned nodes
        const clone = document.querySelector('[style*="left: -9999px"]')
        if (clone) {
          document.body.removeChild(clone)
        }
      }
    }
  }

  const handleExportMarkdown = async (type: 'clipboard' | 'file'): Promise<void> => {
    if (!note) return

    const coverPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)

    const markdownContent = `# ${gameName} - ${t('{{date, niceDate}}', { date })}\n\n![cover](${coverPath})\n\n${note}`

    if (type === 'clipboard') {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(markdownContent)
        toast.success(t('detail.memory.notifications.markdownCopied'))
      } catch (error) {
        toast.error(t('detail.memory.notifications.markdownCopyError', { error }))
      }
    } else {
      // Save as file
      const blob = new Blob([markdownContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${gameName}-memory-${formatDateToISO(date)}.md`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  function renderDateBadge(): React.JSX.Element {
    return (
      <div
        className={cn(
          'pointer-events-none absolute top-2 right-2 z-20 rounded-md bg-background/85 px-2 py-1 text-[11px] leading-none text-muted-foreground shadow-sm backdrop-blur'
        )}
      >
        {t('{{date, niceDate}}', { date })}
      </div>
    )
  }

  function renderCoverImage(): React.JSX.Element {
    return (
      <button
        type="button"
        className={cn(
          'absolute inset-0 z-0 h-full w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 text-left'
        )}
        onClick={() => {
          void handleViewLargeImage()
        }}
        aria-label={t('detail.properties.media.actions.viewLargeImage')}
      >
        <GameImage
          type={`memories/${memoryId}`}
          gameId={gameId}
          className={cn('h-full w-full rounded-none shadow-none')}
          fallback={<MemoryCoverFallback onMissing={() => setIsCoverExist(false)} />}
          onError={() => setIsCoverExist(false)}
          onUpdated={() => setIsCoverExist(true)}
        />
      </button>
    )
  }

  function renderAddNoteButton(): React.JSX.Element {
    return (
      <Button
        type="button"
        size="icon"
        className={cn(
          'absolute top-2 left-2 z-20 size-8 opacity-0 transition-opacity group-hover:opacity-100'
        )}
        onClick={(event) => {
          event.stopPropagation()
          openNoteDialog('edit')
        }}
        aria-label={t('detail.memory.actions.addText')}
      >
        <span className={cn('icon-[mdi--note-plus-outline] size-4')} />
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
          'absolute top-2 left-2 z-20 size-8 opacity-0 transition-opacity group-hover:opacity-100'
        )}
        onClick={(event) => {
          event.stopPropagation()
          void handleCoverSelect()
        }}
        aria-label={t('detail.memory.actions.addCover')}
      >
        <span className={cn('icon-[mdi--image-plus] size-4')} />
      </Button>
    )
  }

  function renderCoverNoteOverlay(): React.JSX.Element {
    return (
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 h-[40%] cursor-pointer overflow-hidden border-t border-border/60 bg-background/70 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[height,background-color,backdrop-filter] duration-300 ease-out group-hover:h-[80%] motion-reduce:transition-none'
        )}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          if (shouldIgnorePreviewClick(event)) return
          openNoteDialog('preview')
        }}
        onKeyDown={handlePreviewKeyDown}
      >
        {renderCardMarkdownPreview('prose-pre:max-h-20')}
      </div>
    )
  }

  function renderCardMarkdownPreview(
    codeBlockMaxHeight: 'prose-pre:max-h-20' | 'prose-pre:max-h-24'
  ): React.JSX.Element {
    return (
      <MarkdownPreview
        value={note}
        className={cn(
          'scrollbar-base-thin h-full overflow-y-auto pr-2 overscroll-contain',
          'prose-headings:my-1 prose-h1:text-base prose-h2:text-base prose-h3:text-sm',
          'prose-p:my-1.5 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5',
          'prose-blockquote:my-1 prose-pre:my-2',
          codeBlockMaxHeight
        )}
      />
    )
  }

  function renderCoverWithNote(): React.JSX.Element {
    return (
      <>
        {renderCoverImage()}
        {renderCoverNoteOverlay()}
      </>
    )
  }

  function renderCoverOnly(): React.JSX.Element {
    return (
      <>
        {renderCoverImage()}
        {renderAddNoteButton()}
      </>
    )
  }

  function renderNoteOnly(): React.JSX.Element {
    return (
      <>
        {renderAddCoverButton()}

        <div
          className={cn('h-full w-full cursor-pointer overflow-hidden p-4')}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (shouldIgnorePreviewClick(event)) return
            openNoteDialog('preview')
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
              void handleCoverSelect()
            }}
          >
            {t('detail.memory.actions.addCover')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              openNoteDialog('edit')
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
    <ContextMenu>
      <ContextMenuTrigger asChild className={cn('w-full')}>
        <Card
          ref={memoryRef}
          key={memoryId}
          className={cn(
            'group relative aspect-square w-full gap-0 overflow-hidden rounded-lg p-0 shadow-md img-initial'
          )}
        >
          {renderDateBadge()}
          {renderCardContent()}
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {/* Cover Image */}
        <ContextMenuItem onSelect={handleCoverSelect}>
          {isCoverExist
            ? t('detail.memory.actions.changeCover')
            : t('detail.memory.actions.addCover')}
        </ContextMenuItem>
        {isCoverExist && (
          <ContextMenuItem onSelect={handleResize}>
            {t('detail.memory.actions.adjustCover')}
          </ContextMenuItem>
        )}

        {/* Note */}
        <ContextMenuItem
          onSelect={() => {
            openNoteDialog('edit')
          }}
        >
          {note ? t('detail.memory.actions.editText') : t('detail.memory.actions.addText')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {/* Set As Game Media */}
        {isCoverExist && (
          <>
            <ContextMenuGroup>
              <ContextMenuSub>
                <ContextMenuSubTrigger>{t('detail.memory.setAs.title')}</ContextMenuSubTrigger>
                <ContextMenuPortal>
                  <ContextMenuSubContent>
                    <ContextMenuItem
                      onSelect={async () => {
                        try {
                          const coverPath = await ipcManager.invoke(
                            'game:get-memory-cover-path',
                            gameId,
                            memoryId
                          )
                          if (!coverPath) {
                            toast.error(t('detail.memory.notifications.imageNotFound'))
                            return
                          }
                          await ipcManager.invoke('game:set-image', gameId, 'cover', coverPath)
                          refreshLight()
                          toast.success(t('detail.memory.notifications.setCoverSuccess'))
                        } catch (error) {
                          toast.error(t('detail.memory.notifications.setCoverError', { error }))
                        }
                      }}
                    >
                      {t('detail.memory.setAs.cover')}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={async () => {
                        try {
                          const coverPath = await ipcManager.invoke(
                            'game:get-memory-cover-path',
                            gameId,
                            memoryId
                          )
                          if (!coverPath) {
                            toast.error(t('detail.memory.notifications.imageNotFound'))
                            return
                          }
                          await ipcManager.invoke('game:set-image', gameId, 'background', coverPath)
                          refreshLight()
                          toast.success(t('detail.memory.notifications.setBackgroundSuccess'))
                        } catch (error) {
                          toast.error(
                            t('detail.memory.notifications.setBackgroundError', { error })
                          )
                        }
                      }}
                    >
                      {t('detail.memory.setAs.background')}
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuPortal>
              </ContextMenuSub>
            </ContextMenuGroup>
          </>
        )}
        {/* Export Options */}
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{t('detail.memory.export.exportAs')}</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>{t('detail.memory.export.image')}</ContextMenuSubTrigger>
                  <ContextMenuPortal>
                    <ContextMenuSubContent>
                      <ContextMenuItem onSelect={handleExportAsImageToClipboard}>
                        {t('detail.memory.export.toClipboard')}
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={handleExportAsImage}>
                        {t('detail.memory.export.saveAs')}
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuPortal>
                </ContextMenuSub>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    {t('detail.memory.export.markdown')}
                  </ContextMenuSubTrigger>
                  <ContextMenuPortal>
                    <ContextMenuSubContent>
                      <ContextMenuItem onSelect={() => handleExportMarkdown('clipboard')}>
                        {t('detail.memory.export.toClipboard')}
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleExportMarkdown('file')}>
                        {t('detail.memory.export.saveAs')}
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuPortal>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        {/* Delete Memory */}
        <ContextMenuItem onSelect={handleDelete}>
          {t('detail.memory.actions.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
      <CropDialog
        isOpen={cropDialogState.isOpen}
        onClose={() =>
          setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })
        }
        imagePath={cropDialogState.imagePath}
        onCropComplete={(filePath) => handleCropComplete(filePath)}
      />
      {isNoteDialogOpen && (
        <NoteDialog
          setIsOpen={setIsNoteDialogOpen}
          note={note}
          saveNote={saveNote}
          initialMode={noteDialogMode}
        />
      )}
    </ContextMenu>
  )
}

function MemoryCoverFallback({ onMissing }: { onMissing: () => void }): React.JSX.Element {
  useEffect(() => {
    onMissing()
  }, [onMissing])

  return <div />
}
