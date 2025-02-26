import { cn, formatDateToChinese, ipcInvoke, formatDateToISO } from '~/utils'
import { GameImage } from '@ui/game-image'
import { Card } from '@ui/card'
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
} from '@ui/context-menu'
import { Button } from '@ui/button'
import { useGameState } from '~/hooks'
import { NoteDialog } from './NoteDialog'
import { useState, useRef } from 'react'
import { TargetBlankLink } from '~/components/utils/TargetBlankLink'
import { CropDialog } from '../Config/AttributesDialog/Media/CropDialog'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'

export function MemoryCard({
  gameId,
  memoryId,
  handleDelete,
  note,
  date,
  setNote
}: {
  gameId: string
  memoryId: string
  handleDelete: () => void
  note: string
  date: string
  setNote: (note: string) => void
}): JSX.Element {
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
    ipcInvoke('update-memory-cover', gameId, memoryId, filePath)
    setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })
  }

  async function handleCoverSelect(): Promise<void> {
    try {
      const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      if (!filePath) return

      setCropDialogState({
        isOpen: true,
        type: '',
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(`选择文件失败: ${error}`)
    }
  }

  async function handleResize(): Promise<void> {
    try {
      // Get current image path
      const currentPath: string = await ipcInvoke('get-memory-cover-path', gameId, memoryId)
      if (!currentPath) {
        toast.error('未找到当前图片')
        return
      }

      setCropDialogState({
        isOpen: true,
        type: '',
        imagePath: currentPath,
        isResizing: true
      })
    } catch (error) {
      toast.error(`获取当前图片失败: ${error}`)
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
              toast.success('图片已成功复制到剪切板')
            })
            .catch((error) => {
              toast.error(`复制图片到剪切板失败: ${error}`)
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

    const coverPath: string = await ipcInvoke('get-memory-cover-path', gameId, memoryId)

    const markdownContent = `# ${gameName} - ${formatDateToChinese(date)}\n\n![cover](${coverPath})\n\n${note}`

    if (type === 'clipboard') {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(markdownContent)
        toast.success('Markdown 已复制到剪贴板')
      } catch (error) {
        toast.error(`复制到剪贴板失败: ${error}`)
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
      <ContextMenuTrigger className={cn('w-full')}>
        <Card ref={memoryRef} key={memoryId} className={cn('w-full h-auto shadow-md img-initial')}>
          <div className={cn('w-full flex flex-col')}>
            {/* Cover Image */}
            <GameImage
              type={`memories/${memoryId}/cover`}
              gameId={gameId}
              className={cn('w-full h-auto rounded-lg shadow-md')}
              fallback={<div />}
              onError={() => setIsCoverExist(false)}
              onUpdated={() => setIsCoverExist(true)}
            />

            {/* Add button area */}
            {(!isCoverExist || !note) && (
              <div className={cn('flex flex-row gap-5 p-5 border-b-[1px]')}>
                {!isCoverExist && <Button onClick={handleCoverSelect}>添加封面</Button>}
                {!note && (
                  <Button
                    onClick={() => {
                      setIsNoteDialogOpen(true)
                    }}
                  >
                    添加文字
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
                {formatDateToChinese(date)}
              </div>
              <div className={cn('rounded-lg px-2 py-1 text-center bg-primary/90')}>{gameName}</div>
            </div>
          </div>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleCoverSelect}>
          {isCoverExist ? '更换封面' : '添加封面'}
        </ContextMenuItem>
        {isCoverExist && <ContextMenuItem onSelect={handleResize}>调整封面</ContextMenuItem>}

        <ContextMenuItem
          onSelect={() => {
            setIsNoteDialogOpen(true)
          }}
        >
          {note ? '修改文字' : '添加文字'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>转存为</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>图片</ContextMenuSubTrigger>
                  <ContextMenuPortal>
                    <ContextMenuSubContent>
                      <ContextMenuItem onSelect={handleExportAsImageToClipboard}>
                        导出至剪切板
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={handleExportAsImage}>另存为</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuPortal>
                </ContextMenuSub>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Markdown</ContextMenuSubTrigger>
                  <ContextMenuPortal>
                    <ContextMenuSubContent>
                      <ContextMenuItem onSelect={() => handleExportMarkdown('clipboard')}>
                        导出至剪切板
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleExportMarkdown('file')}>
                        另存为
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuPortal>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleDelete}>删除</ContextMenuItem>
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
      ></NoteDialog>
    </ContextMenu>
  )
}
