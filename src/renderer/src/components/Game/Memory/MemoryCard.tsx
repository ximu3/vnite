import { cn, formatDateToISO } from '~/utils'
import { GameImage } from '~/components/ui/game-image'
import { Card } from '~/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuGroup
} from '~/components/ui/context-menu'
import { Button } from '~/components/ui/button'
import { useGameState } from '~/hooks'
import { NoteDialog } from './NoteDialog'
import { useState, useRef } from 'react'
import { TargetBlankLink } from '~/components/utils/TargetBlankLink'
import { CropDialog } from '../Config/Properties/Media/CropDialog'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import html2canvas from 'html2canvas-pro'
import { useTranslation } from 'react-i18next'
import Zoom from 'react-medium-image-zoom'
import { ipcManager } from '~/app/ipc'

export function MemoryCard({
  gameId,
  memoryId,
  handleDelete,
  note,
  date,
  setNote,
  saveNote
}: {
  gameId: string
  memoryId: string
  handleDelete: () => void
  note: string
  date: string
  setNote: (note: string) => void
  saveNote: () => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
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

  function handleCropComplete(filePath: string): void {
    ipcManager.invoke('game:update-memory-cover', gameId, memoryId, filePath)
    setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className={cn('w-full')}>
        <Card
          ref={memoryRef}
          key={memoryId}
          className={cn('w-full h-auto shadow-md img-initial p-0')}
        >
          <div className={cn('w-full flex flex-col')}>
            {/* Cover Image */}
            <Zoom>
              <GameImage
                type={`memories/${memoryId}`}
                gameId={gameId}
                className={cn('w-full h-auto rounded-lg shadow-md')}
                fallback={<div />}
                onError={() => setIsCoverExist(false)}
                onUpdated={() => setIsCoverExist(true)}
              />
            </Zoom>

            {/* Actions */}
            {(!isCoverExist || !note) && (
              <div className={cn('flex flex-row gap-5 p-5 border-b-[1px]')}>
                {!isCoverExist && (
                  <Button onClick={handleCoverSelect}>{t('detail.memory.actions.addCover')}</Button>
                )}
                {!note && (
                  <Button
                    onClick={() => {
                      setIsNoteDialogOpen(true)
                    }}
                  >
                    {t('detail.memory.actions.addText')}
                  </Button>
                )}
              </div>
            )}

            {/* Content area */}
            <div className={cn('p-5')}>
              <article className={cn('prose prose-sm dark:prose-invert max-w-none')}>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: TargetBlankLink
                  }}
                >
                  {note}
                </Markdown>
              </article>
            </div>

            {/* Date display area */}
            <div
              className={cn(
                'flex flex-row-reverse px-5 pb-5 items-center gap-2 text-xs text-primary-foreground/90'
              )}
            >
              <div className={cn('rounded-lg px-2 py-1 text-center bg-primary/90')}>
                {t('{{date, niceDate}}', { date })}
              </div>
              <div className={cn('rounded-lg px-2 py-1 text-center bg-primary/90')}>{gameName}</div>
            </div>
          </div>
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
            setIsNoteDialogOpen(true)
          }}
        >
          {note ? t('detail.memory.actions.editText') : t('detail.memory.actions.addText')}
        </ContextMenuItem>
        <ContextMenuSeparator />
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
      <NoteDialog
        isOpen={isNoteDialogOpen}
        setIsOpen={setIsNoteDialogOpen}
        note={note}
        setNote={setNote}
        saveNote={saveNote}
      ></NoteDialog>
    </ContextMenu>
  )
}
