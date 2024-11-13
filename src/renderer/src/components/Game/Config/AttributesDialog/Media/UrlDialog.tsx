import { cn } from '~/utils'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'

export function UrlDialog({
  mediaUrl,
  setMediaUrl,
  setMediaWithUrl,
  isUrlDialogOpen,
  setIsUrlDialogOpen,
  type
}: {
  mediaUrl: string
  setMediaUrl: (url: string) => void
  setMediaWithUrl: (type: string) => void
  isUrlDialogOpen: boolean
  setIsUrlDialogOpen: (isOpen: boolean) => void
  type: string
}): JSX.Element {
  return (
    <Dialog open={isUrlDialogOpen}>
      <DialogTrigger>
        <Button
          variant={'outline'}
          size={'icon'}
          className={cn('w-7 h-7')}
          onClick={() => {
            setIsUrlDialogOpen(true)
          }}
        >
          <span className={cn('icon-[mdi--link-variant] w-4 h-4')}></span>
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <div className={cn('flex flex-row gap-2')}>
          <Input
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value)
            }}
          />
          <Button
            onClick={() => {
              setMediaWithUrl(type)
            }}
          >
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
