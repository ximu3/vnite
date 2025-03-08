import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { cn } from '~/utils'
import { useGameCollectionStore } from '~/stores'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function AddCollectionDialog({
  gameIds,
  setIsOpen
}: {
  gameIds: string[]
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation('game')
  const [name, setName] = useState('')
  const { addCollection } = useGameCollectionStore()

  const addGameToNewCollection = (): void => {
    addCollection(name, gameIds)
    setIsOpen(false)
  }

  return (
    <Dialog open={true} onOpenChange={(state) => setIsOpen(state)}>
      <DialogContent className={cn('')}>
        <DialogHeader>
          <DialogTitle>{t('detail.collection.dialog.title')}</DialogTitle>
          <DialogDescription>{t('detail.collection.dialog.description')}</DialogDescription>
        </DialogHeader>
        <Input
          className={cn('grow')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addGameToNewCollection()
          }}
        />
        <DialogFooter>
          <Button onClick={addGameToNewCollection}>{t('detail.collection.dialog.add')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
