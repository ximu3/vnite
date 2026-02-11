import { SeparatorDashed } from '@ui/separator-dashed'
import { isEqual } from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '~/components/ui/link'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { RelatedSitesDialog } from './RelatedSitesDialog'
import { SearchRelatedSitesDialog } from './SearchRelatedSitesDialog'

export function RelatedSitesCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [relatedSites, setRelatedSites] = useGameState(gameId, 'metadata.relatedSites')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [name] = useGameState(gameId, 'metadata.name')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)

  const handleSelectRelatedSites = (newRelatedSites: { label: string; url: string }[]): void => {
    setRelatedSites(newRelatedSites)
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div
          className={cn('font-bold select-none cursor-pointer')}
          onClick={() =>
            copyWithToast(relatedSites.map((item) => `${item.label}: ${item.url}`).join('\n'))
          }
        >
          {t('detail.overview.sections.relatedSites')}
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
      <div className={cn('flex flex-col text-sm justify-start gap-[6px] items-start')}>
        {isEqual(relatedSites, []) || isEqual(relatedSites, [{ label: '', url: '' }])
          ? t('detail.overview.relatedSites.empty')
          : relatedSites.map((site, index) => (
              <Link
                key={`${gameId}-${site.label}-${site.url}-${index}`}
                name={site.label}
                url={site.url}
                tooltipSide="left"
              />
            ))}
      </div>
      <RelatedSitesDialog
        gameId={gameId}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />

      <SearchRelatedSitesDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        gameTitle={originalName || name}
        onSelect={handleSelectRelatedSites}
        initialRelatedSites={relatedSites}
      />
    </div>
  )
}
