import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { cn, formatTimeToChinese } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { toNumber } from 'lodash'

export function PlayingTimeEditorDialog({
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
  const [playingTime, setPlayingTime] = useDBSyncedState(0, `games/${gameId}/record.json`, [
    'playingTime'
  ])
  return (
    <Dialog open={isOpen}>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[500px] flex flex-row gap-3 items-center')}
      >
        <div className={cn('grow whitespace-nowrap')}>{formatTimeToChinese(playingTime)}</div>
        <Input
          className={cn('w-full')}
          value={playingTime}
          onChange={(e) => {
            setPlayingTime(toNumber(e.target.value))
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
