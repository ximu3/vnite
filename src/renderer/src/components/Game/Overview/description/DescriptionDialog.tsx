import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Textarea } from '@ui/textarea'
import { cn } from '~/utils'
import { useGameState } from '~/hooks'

export function DescriptionDialog({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [description, setDescription] = useGameState(gameId, 'metadata.description')

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('w-1/2 h-1/2 max-w-none flex flex-col gap-5')}>
        <div className={cn('text-xs -mb-2')}>{t('detail.overview.description.htmlHint')}</div>
        <Textarea
          spellCheck={false}
          className={cn('grow resize-none')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('detail.overview.description.empty')}
        />
      </DialogContent>
    </Dialog>
  )
}
