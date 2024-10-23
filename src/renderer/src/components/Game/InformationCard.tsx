import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { InformationDialog } from './InformationDialog'

export function InformationCard({
  index,
  className = ''
}: {
  index: string
  className?: string
}): JSX.Element {
  const [originalName] = useDBSyncedState('', `games/${index}/metadata.json`, ['originalName'])
  const [developer] = useDBSyncedState('', `games/${index}/metadata.json`, ['developer'])
  const [publisher] = useDBSyncedState('', `games/${index}/metadata.json`, ['publisher'])
  const [releaseDate] = useDBSyncedState('', `games/${index}/metadata.json`, ['releaseDate'])
  const [genres] = useDBSyncedState([''], `games/${index}/metadata.json`, ['genres'])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('pb-1')}>基本信息</div>
            <InformationDialog index={index} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-2 text-sm')}>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>原名</div>
            <div className={cn('grow')}>{originalName}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>开发商</div>
            <div>{developer}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>发行商</div>
            <div className={cn('grow')}>{publisher}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>发行日期</div>
            <div className={cn('grow')}>{releaseDate}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>类型</div>
            <div className={cn('grow')}>{genres.join(', ')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
