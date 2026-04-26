import { Card } from '@ui/card'
import { Dialog, DialogContent } from '@ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { MarkdownEditor } from './MarkdownEditor'
import { MarkdownPreview } from './MarkdownPreview'

export type NoteDialogMode = 'edit' | 'preview'

export function NoteDialog({
  setIsOpen,
  note,
  saveNote,
  initialMode = 'edit'
}: {
  setIsOpen: (isOpen: boolean) => void
  note: string
  saveNote: (note: string) => Promise<void>
  initialMode?: NoteDialogMode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [draft, setDraft] = useState(note ?? '')
  const [mode, setMode] = useState<NoteDialogMode>(initialMode)

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

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'w-[min(980px,82vw)] h-[82vh] max-w-none min-w-[640px] flex min-h-0 flex-col gap-3'
        )}
      >
        <Tabs value={mode} onValueChange={(value) => setMode(value as NoteDialogMode)}>
          <div className={cn('flex items-center pr-8')}>
            <TabsList>
              <TabsTrigger value="edit" className={cn('px-5')}>
                {t('detail.memory.editor.edit', { defaultValue: 'Edit' })}
              </TabsTrigger>
              <TabsTrigger value="preview" className={cn('px-5')}>
                {t('detail.memory.editor.preview', { defaultValue: 'Preview' })}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className={cn('min-h-0 flex-1')}>
          {mode === 'edit' ? (
            <MarkdownEditor value={draft} onChange={setDraft} />
          ) : (
            <Card
              className={cn(
                'scrollbar-base-thin h-full overflow-auto rounded-md bg-card p-5 shadow-sm'
              )}
            >
              <MarkdownPreview
                value={draft}
                emptyLabel={t('detail.memory.editor.emptyPreview', {
                  defaultValue: 'Nothing to preview'
                })}
              />
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
