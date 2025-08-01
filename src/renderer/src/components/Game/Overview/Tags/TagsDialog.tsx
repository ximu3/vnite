import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { cn } from '~/utils'
import { useGameState } from '~/hooks'
import { ArrayInput } from '~/components/ui/array-input'

export function TagsDialog({
  gameId,
  isOpen,
  setIsOpen
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [tags, setTags, saveTags] = useGameState(gameId, 'metadata.tags', true)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={cn('w-[500px] h-[300px] max-w-none flex flex-col gap-5')}>
        <div className={cn('text-xs -mb-2')}>{t('detail.overview.tags.separator')}</div>
        <ArrayInput
          className={cn('grow resize-none')}
          value={tags}
          onChange={setTags}
          onBlur={saveTags}
          placeholder={t('detail.overview.tags.empty')}
          isTextarea
          isHaveTooltip={false}
        />
      </DialogContent>
    </Dialog>
  )
}
