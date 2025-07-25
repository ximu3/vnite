import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'

export function NoteDialog({
  isOpen,
  setIsOpen,
  note,
  setNote,
  saveNote
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  note: string
  setNote: (note: string) => void
  saveNote: () => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation('game')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={cn('w-[50vw] h-[80vh] max-w-none flex flex-col gap-5')}>
        <div className={cn('text-xs -mb-2')}>{t('detail.memory.dialog.markdownHint')}</div>
        <Textarea
          spellCheck={false}
          className={cn('grow resize-none')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
        />
      </DialogContent>
    </Dialog>
  )
}
