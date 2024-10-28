import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { cn } from '~/utils'
import { useCollections } from '~/hooks'
import { useState } from 'react'

export function AddCollectionDialog({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): JSX.Element {
  const [name, setName] = useState('')
  const { addCollection } = useCollections()
  const addGameToNewCollection = (): void => {
    addCollection(name, gameId)
  }
  return (
    <Dialog>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent className={cn('')}>
        <DialogHeader>
          <DialogTitle>新收藏</DialogTitle>
          <DialogDescription>输入新收藏的名称</DialogDescription>
        </DialogHeader>
        <Input className={cn('grow')} value={name} onChange={(e) => setName(e.target.value)} />
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={addGameToNewCollection}>添加</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
