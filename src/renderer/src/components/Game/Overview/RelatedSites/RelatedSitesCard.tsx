import { Link } from '@ui/link'
import { Separator } from '@ui/separator'
import { isEqual } from 'lodash'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { RelatedSitesDialog } from './RelatedSitesDialog'

export function RelatedSitesCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
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
          相关网站
        </div>
        <RelatedSitesDialog gameId={gameId} />
      </div>
      <Separator className={cn('my-3 bg-primary')} />
      <div className={cn('flex flex-col text-sm justify-start items-start')}>
        {isEqual(relatedSites, []) || isEqual(relatedSites, [{ label: '', url: '' }])
          ? '暂无相关网站'
          : relatedSites.map((site, index) => (
              <Link
                key={`${gameId}-${site.label}-${site.url}-${index}`}
                name={site.label}
                url={site.url}
              />
            ))}
      </div>
    </div>
  )
}
