import { SeparatorDashed } from '@ui/separator-dashed'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { SearchTagsDialog } from './SearchTagsDialog'
import { TagsDialog } from './TagsDialog'

export function TagsCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [tags, setTags] = useGameState(gameId, 'metadata.tags')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleSelectTags = (newTags: string[]): void => {
    setTags(newTags)
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div
          className={cn('font-bold select-none cursor-pointer')}
          onClick={() => copyWithToast(`${tags.join(', ')}`)}
        >
          {t('detail.overview.sections.tags')}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'invisible group-hover:visible hover:text-primary cursor-pointer icon-[mdi--magnify] w-5 h-5'
            )}
            onClick={() => setIsSearchDialogOpen(true)}
          ></span>
          <span
            className={cn(
              'invisible group-hover:visible hover:text-primary cursor-pointer icon-[mdi--square-edit-outline] w-5 h-5'
            )}
            onClick={() => setIsEditDialogOpen(true)}
          ></span>
        </div>
      </div>
      <SeparatorDashed />
      <div className={cn('text-sm justify-start items-start')}>
        <div className={cn('flex flex-wrap gap-x-1 gap-y-[6px]')}>
          {tags.join(', ') === ''
            ? t('detail.overview.tags.empty')
            : tags.map((tag) => (
                <React.Fragment key={tag}>
                  <FilterAdder field="metadata.tags" value={tag} className={cn('')} />
                </React.Fragment>
              ))}
        </div>
      </div>

      <TagsDialog gameId={gameId} isOpen={isEditDialogOpen} setIsOpen={setIsEditDialogOpen} />

      <SearchTagsDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        gameTitle={originalName}
        onSelect={handleSelectTags}
        initialTags={tags}
      />
    </div>
  )
}
