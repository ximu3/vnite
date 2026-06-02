import type { GameMediaType } from '@appTypes/models'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { cn } from '~/utils'

export function UrlDialog({
  setMediaWithUrl,
  isUrlDialogOpen,
  setIsUrlDialogOpen,
  type
}: {
  setMediaWithUrl: (type: GameMediaType, URL: string) => void
  isUrlDialogOpen: Record<GameMediaType, boolean>
  setIsUrlDialogOpen: (isOpen: Record<GameMediaType, boolean>) => void
  type: GameMediaType
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [mediaUrl, setMediaUrl] = useState<string>('')

  return (
    <Dialog
      open={isUrlDialogOpen[type]}
      onOpenChange={(isOpen) => setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: isOpen })}
    >
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
      <DialogContent showCloseButton={false} className="w-[500px]">
        <div className={cn('flex flex-row gap-2')}>
          <Input
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value)
            }}
          />
          <Button
            onClick={() => {
              if (!mediaUrl) {
                toast.error(t('detail.properties.media.url.empty'))
                return
              }
              setMediaWithUrl(type, mediaUrl)
            }}
          >
            {t('utils:common.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
