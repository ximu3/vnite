import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenu,
  ContextMenuSeparator
} from '@ui/context-menu'
import { Dialog, DialogContent } from '@ui/dialog'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@ui/alert-dialog'
import { useCollections } from '~/hooks'
import { cn } from '~/utils'
import { useEffect, useState } from 'react'

export function CollectionCM({
  collectionId,
  children
}: {
  collectionId: string
  children: React.ReactNode
}): JSX.Element {
  const { renameCollection, removeCollection, collections } = useCollections()
  const [newName, setNewName] = useState<string>('')
  const [isRenaming, setisRenaming] = useState<boolean>(false)
  const [isDeleting, setisDeleting] = useState<boolean>(false)

  useEffect(() => {
    if (collections[collectionId].name !== newName) {
      setNewName(collections[collectionId].name)
    }
  }, [collections[collectionId].name])

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>

      <ContextMenuContent className={cn('w-40')}>
        <ContextMenuItem onSelect={() => setisRenaming(true)}>重命名</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => setisDeleting(true)}>删除</ContextMenuItem>
      </ContextMenuContent>

      <Dialog open={isRenaming}>
        <DialogContent showCloseButton={false} className={cn('w-[500px] flex flex-row gap-3')}>
          <Input
            className={cn('w-full')}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
            }}
          />
          <Button
            onClick={() => {
              renameCollection(collectionId, newName)
              setisRenaming(false)
            }}
          >
            确定
          </Button>
          <Button
            onClick={() => {
              setisRenaming(false)
              setNewName(collections[collectionId].name)
            }}
          >
            取消
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除收藏</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>{`确定要删除收藏 ${collections[collectionId].name} 吗？`}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setisDeleting(false)
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeCollection(collectionId)
              }}
            >
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  )
}
