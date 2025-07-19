import { useTranslation } from 'react-i18next'
import parse from 'html-react-parser'
import { useGameState } from '~/hooks'
import { cn, copyWithToast, HTMLParserOptions } from '~/utils'
import { DescriptionDialog } from './DescriptionDialog'
import { SearchDescriptionDialog } from './SearchDescriptionDialog'
import { useState } from 'react'
import { SeparatorDashed } from '@ui/separator-dashed'

export function DescriptionCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [description, setDescription] = useGameState(gameId, 'metadata.description')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)

  const handleSelectDescription = (newDescription: string): void => {
    setDescription(newDescription)
  }

  return (
    <div className={cn('bg-transparent border-0 shadow-none', className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div
          className={cn('font-bold select-none cursor-pointer')}
          onClick={() => copyWithToast(description)}
        >
          {t('detail.overview.sections.description')}
        </div>
        <div className="flex items-center gap-3">
          <span
            onClick={() => setIsSearchDialogOpen(true)}
            className={cn(
              'invisible group-hover:visible cursor-pointer icon-[mdi--magnify] w-5 h-5 mb-[4px]'
            )}
          ></span>
          <DescriptionDialog gameId={gameId} />
        </div>
      </div>
      <SeparatorDashed />

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

      <SearchDescriptionDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        gameTitle={originalName}
        onSelect={handleSelectDescription}
      />
    </div>
  )
}
