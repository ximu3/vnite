import { useTranslation } from 'react-i18next'
import { Separator } from '@ui/separator'
import parse from 'html-react-parser'
import { useGameState } from '~/hooks'
import { cn, copyWithToast, HTMLParserOptions } from '~/utils'
import { DescriptionDialog } from './DescriptionDialog'

export function DescriptionCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const { t } = useTranslation('game')
  const [description] = useGameState(gameId, 'metadata.description')

  return (
    <div className={cn('bg-transparent border-0 shadow-none', className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div
          className={cn('font-bold select-none cursor-pointer')}
          onClick={() => copyWithToast(description)}
        >
          {t('detail.overview.sections.description')}
        </div>
        <DescriptionDialog gameId={gameId} />
      </div>
      <Separator className={cn('my-3 bg-primary')} />

      <div
        className={cn(
          'text-sm',
          'prose-a:text-primary', // Link Color
          'prose-a:no-underline hover:prose-a:underline', // underline effect
          'space-before-0',
          'whitespace-pre-line',
          'break-words',
          'leading-7'
        )}
      >
        {description
          ? parse(description, HTMLParserOptions)
          : t('detail.overview.description.empty')}
      </div>
    </div>
  )
}
