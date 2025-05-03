import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { TransformerRule } from './types'
import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'

interface EditDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transformer: TransformerRule | null
  onSave: (name: string, note: string) => void
}

export function EditDialog({
  isOpen,
  onOpenChange,
  transformer,
  onSave
}: EditDialogProps): JSX.Element {
  const { t } = useTranslation('transformer')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  // Reset the form when the selected transformer changes or the dialog opens
  useEffect(() => {
    if (transformer && isOpen) {
      setName(transformer.name)
      setNote(transformer.note)
    }
  }, [transformer, isOpen])

  // Submit the form
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name, note)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editDialog.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="pt-2 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 items-center text-sm">
            <div className={cn('whitespace-nowrap select-none justify-self-start')}>
              {t('editDialog.name')}
            </div>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 items-center text-sm">
            <div className={cn('whitespace-nowrap select-none justify-self-start')}>
              {t('editDialog.note')}
            </div>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className=""
              placeholder={t('editDialog.notePlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('editDialog.cancel')}
            </Button>
            <Button type="submit">{t('editDialog.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
