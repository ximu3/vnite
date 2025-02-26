import { Dialog, DialogContent } from '@ui/dialog'
import { Textarea } from '@ui/textarea'
import { cn } from '~/utils'

export function NoteDialog({
  isOpen,
  setIsOpen,
  note,
  setNote
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  note: string
  setNote: (note: string) => void
}): JSX.Element {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className={cn('w-1/2 h-2/3 max-w-none flex flex-col gap-5')}
        onClose={() => setIsOpen(false)}
      >
        <div className={cn('text-xs -mb-2')}>支持 Markdown 语法</div>
        <Textarea
          spellCheck={false}
          className={cn('grow resize-none')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </DialogContent>
    </Dialog>
  )
}
