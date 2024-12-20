import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'

export function NameEditorDialog({
  gameId,
  isOpen,
  setIsOpen,
  children
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  children: React.ReactNode
}): JSX.Element {
  const [gameName, setGameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  return (
    <Dialog open={isOpen}>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent showCloseButton={false} className={cn('w-[500px] flex flex-row gap-3')}>
        <Input
          className={cn('w-full')}
          value={gameName}
          onChange={(e) => {
            setGameName(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsOpen(false)
          }}
        />
        <Button
          onClick={() => {
            setIsOpen(false)
          }}
        >
          确定
        </Button>
      </DialogContent>
    </Dialog>
  )
}
