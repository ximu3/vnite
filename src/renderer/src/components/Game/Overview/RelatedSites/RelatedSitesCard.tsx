import { cn } from '~/utils'
import { Link } from '@ui/link'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { useDBSyncedState } from '~/hooks'
import { RelatedSitesDialog } from './RelatedSitesDialog'
import { isEqual } from 'lodash'

export function RelatedSitesCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [relatedSites] = useDBSyncedState(
    [{ label: '', url: '' }],
    `games/${gameId}/metadata.json`,
    ['relatedSites']
  )
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>相关网站</div>
            <RelatedSitesDialog gameId={gameId} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'flex flex-col text-sm justify-start items-start overflow-auto scrollbar-base max-h-[220px]',
            '3xl:max-h-[408px] sm:max-h-[3vh] '
          )}
        >
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
      </CardContent>
    </Card>
  )
}
