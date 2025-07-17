import { Link } from '~/components/ui/link'
import { isEqual } from 'lodash'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { RelatedSitesDialog } from './RelatedSitesDialog'

export function RelatedSitesCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [relatedSites] = useGameState(gameId, 'metadata.relatedSites')

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
        <RelatedSitesDialog gameId={gameId} />
      </div>
      <div className={cn('flex items-center justify-center flex-grow')}>
        <div className="w-full h-px my-3 border-t border-dashed border-primary" />
      </div>
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
    </div>
  )
}
