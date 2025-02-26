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

export function AddCollectionDialog({
  gameIds,
  setIsOpen
}: {
  gameIds: string[]
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
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
          <DialogTitle>新收藏</DialogTitle>
          <DialogDescription>输入新收藏的名称</DialogDescription>
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
          <Button onClick={addGameToNewCollection}>添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
