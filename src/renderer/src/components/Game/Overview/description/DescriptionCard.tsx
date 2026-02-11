import { SeparatorDashed } from '@ui/separator-dashed'
import parse from 'html-react-parser'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn, copyWithToast, HTMLParserOptions } from '~/utils'
import { DescriptionDialog } from './DescriptionDialog'
import { SearchDescriptionDialog } from './SearchDescriptionDialog'

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [isCollapsed, setIsCollapsed] = useState(false)

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
        {/* Actions */}
        <div className="flex items-center gap-3">
          <span
            onClick={() => setIsSearchDialogOpen(true)}
            className={cn(
              'invisible group-hover:visible',
              'hover:text-primary cursor-pointer icon-[mdi--magnify] w-5 h-5'
            )}
          ></span>
          <span
            onClick={() => setIsEditDialogOpen(true)}
            className={cn(
              'invisible group-hover:visible',
              'hover:text-primary cursor-pointer icon-[mdi--square-edit-outline] w-5 h-5 '
            )}
          ></span>
          <span
            className={cn(
              'hover:text-primary cursor-pointer w-5 h-5',
              isCollapsed
                ? 'icon-[mdi--chevron-right]'
                : 'invisible group-hover:visible icon-[mdi--chevron-down]'
            )}
            onClick={() => setIsCollapsed((v) => !v)}
          ></span>
        </div>
      </div>
      <SeparatorDashed />

      {!isCollapsed && (
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
      )}

      <DescriptionDialog
        gameId={gameId}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />

      <SearchDescriptionDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        gameTitle={originalName}
        onSelect={handleSelectDescription}
      />
    </div>
  )
}
