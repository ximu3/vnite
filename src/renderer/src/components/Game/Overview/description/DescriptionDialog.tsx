import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { HtmlDescriptionEditor, type HtmlDescriptionEditorHandle } from './HtmlDescriptionEditor'

export function DescriptionDialog({
  gameId,
  isOpen,
  setIsOpen
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [draft, setDraft, saveDraft] = useGameState(gameId, 'metadata.description', true)
  const editorRef = useRef<HtmlDescriptionEditorHandle>(null)

  useEffect(() => {
    if (!isOpen) return

    const frameId = window.requestAnimationFrame(() => {
      editorRef.current?.focusEditorEnd()
    })

    return (): void => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isOpen])

  async function closeDialog(): Promise<void> {
    await saveDraft()
    setIsOpen(false)
  }

  function handleOpenChange(open: boolean): void {
    if (open) {
      setIsOpen(true)
      return
    }

    void closeDialog()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
        className={cn('w-[min(1100px,86vw)] h-[82vh] max-w-none flex min-h-0 flex-col gap-4')}
      >
        <DialogHeader className={cn('gap-1')}>
          <DialogTitle>{t('detail.overview.sections.description')}</DialogTitle>
        </DialogHeader>

        <div className={cn('min-h-0 flex-1')}>
          <HtmlDescriptionEditor ref={editorRef} value={draft} onChange={setDraft} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
