import { cn } from '~/utils'
import { Link } from '@ui/link'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { useDBSyncedState } from '~/hooks'
import { RelatedSiteDialog } from './RelatedSiteDialog'

export function RelatedSiteCard({
  index,
  className = ''
}: {
  index: string
  className?: string
}): JSX.Element {
  const [relatedSites] = useDBSyncedState([{ name: '', url: '' }], `games/${index}/metadata.json`, [
    'relatedSites'
  ])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>相关网站</div>
            <RelatedSiteDialog index={index} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'flex flex-col text-sm justify-start items-start overflow-auto scrollbar-base max-h-[200px]',
            '3xl:max-h-[400px]'
          )}
        >
          {relatedSites.map((site) => (
            <Link key={site.name} name={site.name} url={site.url} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
