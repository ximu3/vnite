import { cn } from '~/utils'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { useState } from 'react'

export function UrlDialog({
  setMediaWithUrl,
  isUrlDialogOpen,
  setIsUrlDialogOpen,
  type
}: {
  setMediaWithUrl: (type: string, URL: string) => void
  isUrlDialogOpen: { icon: boolean; cover: boolean; background: boolean }
  setIsUrlDialogOpen: (isOpen: { icon: boolean; cover: boolean; background: boolean }) => void
  type: string
}): JSX.Element {
  const [mediaUrl, setMediaUrl] = useState<string>('')
  return (
    <Dialog open={isUrlDialogOpen[type]}>
      <DialogTrigger>
        <Button
          variant={'outline'}
          size={'icon'}
          className={cn('w-7 h-7')}
          onClick={() => {
            setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: true })
          }}
        >
          <span className={cn('icon-[mdi--link-variant] w-4 h-4')}></span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        <div className={cn('flex flex-row gap-2')}>
          <Input
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value)
            }}
          />
          <Button
            onClick={() => {
              setMediaWithUrl(type, mediaUrl)
            }}
          >
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
