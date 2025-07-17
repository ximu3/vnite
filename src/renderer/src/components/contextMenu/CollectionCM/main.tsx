import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenu,
  ContextMenuSeparator
} from '~/components/ui/context-menu'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function CollectionCM({
  collectionId,
  children
}: {
  collectionId: string
  children: React.ReactNode
}): React.JSX.Element {
  const { renameCollection, removeCollection, documents: collections } = useGameCollectionStore()
  const [newName, setNewName] = useState<string>('')
  const [isRenaming, setIsRenaming] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { t } = useTranslation('game')

  useEffect(() => {
    if (collections[collectionId].name !== newName) {
      setNewName(collections[collectionId].name)
    }
  }, [collections[collectionId].name])

  const handleRename = (): void => {
    renameCollection(collectionId, newName)
    setIsRenaming(false)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>

      <ContextMenuContent className={cn('w-40')}>
        <ContextMenuItem onSelect={() => setIsRenaming(true)}>
          {t('showcase.collection.contextMenu.rename')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => setIsDeleting(true)}>
          {t('showcase.collection.contextMenu.delete')}
        </ContextMenuItem>
      </ContextMenuContent>

      <Dialog open={isRenaming}>
        <DialogContent showCloseButton={false} className={cn('w-[500px] flex flex-row gap-3')}>
          <Input
            className={cn('w-full')}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
            }}
          />
          <Button onClick={handleRename}>{t('utils:common.confirm')}</Button>
          <Button
            onClick={() => {
              setIsRenaming(false)
              setNewName(collections[collectionId].name)
            }}
          >
            {t('utils:common.cancel')}
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('showcase.collection.contextMenu.deleteTitle')}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {t('showcase.collection.contextMenu.deleteConfirm', {
              name: collections[collectionId].name
            })}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleting(false)
              }}
            >
              {t('utils:common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeCollection(collectionId)
              }}
            >
              {t('utils:common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  )
}
