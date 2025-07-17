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
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'cursor-pointer icon-[mdi--magnify] invisible group-hover:visible w-5 h-5 mb-[4px]'
            )}
            onClick={() => setIsSearchDialogOpen(true)}
          ></span>

          <TagsDialog gameId={gameId} />
        </div>
      </div>
      <div className={cn('flex items-center justify-center flex-grow')}>
        <div className="w-full h-px my-3 border-t border-dashed border-primary" />
      </div>
      <div className={cn('text-sm justify-start items-start')}>
        <div className={cn('flex flex-wrap gap-x-1 gap-y-[6px]')}>
          {tags.join(', ') === ''
            ? t('detail.overview.tags.empty')
            : tags.map((tag) => (
                <React.Fragment key={tag}>
                  <FilterAdder filed="metadata.tags" value={tag} className={cn('')} />
                </React.Fragment>
              ))}
        </div>
      </div>

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
