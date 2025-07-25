import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/utils'
import { useGameState } from '~/hooks'

export function DescriptionDialog({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [description, setDescription, saveDescription] = useGameState(
    gameId,
    'metadata.description',
    true
  )

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn(
            'invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline] cursor-pointer'
          )}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('w-[70vw] h-[70vh] lg:h-[80vh] max-w-none flex flex-col gap-5')}>
        <div className={cn('text-xs -mb-2')}>{t('detail.overview.description.htmlHint')}</div>
        <Textarea
          spellCheck={false}
          className={cn('grow resize-none')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder={t('detail.overview.description.empty')}
        />
      </DialogContent>
    </Dialog>
  )
}
