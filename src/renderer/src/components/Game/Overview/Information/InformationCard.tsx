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
  const [developers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['developers'])
  const [publishers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['publishers'])
  const [releaseDate] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['releaseDate'])
  const [genres] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['genres'])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('')}>基本信息</div>
            <InformationDialog gameId={gameId} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-2 text-sm')}>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>原名</div>
            <div className={cn('max-w-[160px] truncate', '3xl:max-w-[250px]')}>
              {originalName === '' ? '暂无' : originalName}
            </div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>开发商</div>
            <div className={cn('max-w-[160px] truncate', '3xl:max-w-[250px]')}>
              {developers.join(',') === '' ? '暂无' : developers.join(', ')}
            </div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>发行商</div>
            <div className={cn('max-w-[160px] truncate', '3xl:max-w-[250px]')}>
              {publishers.join(',') === '' ? '暂无' : publishers.join(',')}
            </div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>发行日期</div>
            <div className={cn('grow')}>{releaseDate === '' ? '暂无' : releaseDate}</div>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>类型</div>
            <div className={cn('max-w-[160px] truncate', '3xl:max-w-[250px]')}>
              {genres.join(', ') === '' ? '暂无' : genres.join(', ')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
