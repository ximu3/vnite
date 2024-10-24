import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { useDBSyncedState } from '~/hooks'
import { TagsDialog } from './TagsDialog'

export function TagsCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [tags] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['tags'])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>标签</div>
            <TagsDialog gameId={gameId} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'flex flex-col text-sm justify-start items-start overflow-auto scrollbar-base max-h-[52px] text-wrap',
            '3xl:max-h-[200px]'
          )}
        >
          {tags.join(', ') === '' ? '暂无标签' : tags.join(', ')}
        </div>
      </CardContent>
    </Card>
  )
}
