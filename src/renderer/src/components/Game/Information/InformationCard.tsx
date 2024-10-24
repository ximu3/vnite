import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { InformationDialog } from './InformationDialog'

export function InformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [originalName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['originalName'])
  const [developer] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['developer'])
  const [publisher] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['publisher'])
  const [releaseDate] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['releaseDate'])
  const [genres] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['genres'])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('pb-1')}>基本信息</div>
            <InformationDialog gameId={gameId} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-2 text-sm')}>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>原名</div>
            <div className={cn('grow')}>{originalName === '' ? '暂无' : originalName}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>开发商</div>
            <div>{developer === '' ? '暂无' : developer}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>发行商</div>
            <div className={cn('grow')}>{publisher === '' ? '暂无' : publisher}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>发行日期</div>
            <div className={cn('grow')}>{releaseDate === '' ? '暂无' : publisher}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>类型</div>
            <div className={cn('grow')}>
              {genres.join(', ') === '' ? '暂无' : genres.join(', ')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
