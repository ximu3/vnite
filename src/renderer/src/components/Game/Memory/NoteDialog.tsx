import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@ui/card'
import { Dialog, DialogContent } from '@ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { cn } from '~/utils'
import { createImageViewerRequestFromElements } from '~/utils/image-viewer'
import { useGameDetailStore } from '../store'
import { MarkdownEditor, type MarkdownEditorHandle } from './MarkdownEditor'
import { MarkdownPreview } from './MarkdownPreview'

export type NoteDialogMode = 'edit' | 'preview'

export function NoteDialog({
  gameId,
  setIsOpen,
  note,
  saveNote,
  initialMode = 'edit'
}: {
  gameId: string
  setIsOpen: (isOpen: boolean) => void
  note: string
  saveNote: (note: string) => Promise<void>
  initialMode?: NoteDialogMode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [draft, setDraft] = useState(note ?? '')
  const [mode, setMode] = useState<NoteDialogMode>(initialMode)
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const openImageViewer = useGameDetailStore((state) => state.openImageViewer)

  useEffect(() => {
    if (mode !== 'edit') return

    const frameId = window.requestAnimationFrame(() => {
      editorRef.current?.focusEditorEnd()
    })

    return (): void => {
      window.cancelAnimationFrame(frameId)
    }
  }, [mode])

  async function closeDialog(): Promise<void> {
    if (draft !== (note ?? '')) {
      await saveNote(draft)
    }
    setIsOpen(false)
  }

  function handleOpenChange(open: boolean): void {
    if (open) return

    void closeDialog()
  }

  function handlePreviewImageClick(
    selectedImage: HTMLImageElement,
    images: NodeListOf<HTMLImageElement>
  ): void {
    const request = createImageViewerRequestFromElements(
      images,
      selectedImage,
      `memory-inline-${gameId}`
    )
    if (request) openImageViewer(request)
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          if (mode === 'edit') {
            event.preventDefault()
          }
        }}
        className={cn(
          'w-[min(980px,82vw)] h-[82vh] max-w-none min-w-[640px] flex min-h-0 flex-col gap-3'
        )}
      >
        <Tabs value={mode} onValueChange={(value) => setMode(value as NoteDialogMode)}>
          <div className={cn('flex items-center pr-8')}>
            <TabsList>
              <TabsTrigger value="edit" className={cn('px-5')}>
                {t('detail.memory.editor.edit')}
              </TabsTrigger>
              <TabsTrigger value="preview" className={cn('px-5')}>
                {t('detail.memory.editor.preview')}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className={cn('min-h-0 flex-1')}>
          {mode === 'edit' ? (
            <MarkdownEditor ref={editorRef} gameId={gameId} value={draft} onChange={setDraft} />
          ) : (
            <Card
              className={cn(
                'scrollbar-base-thin h-full overflow-auto rounded-md bg-card p-5 shadow-sm'
              )}
            >
              <MarkdownPreview
                value={draft}
                onImageClick={handlePreviewImageClick}
                emptyLabel={t('detail.memory.editor.emptyPreview')}
              />
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
