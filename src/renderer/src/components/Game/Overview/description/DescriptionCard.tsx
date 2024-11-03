import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { DescriptionDialog } from './DescriptionDialog'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import parse from 'html-react-parser'

export function DescriptionCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [description] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['description'])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>简介</div>
            <DescriptionDialog gameId={gameId} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div
          className={cn('max-h-[300px] text-sm overflow-auto scrollbar-base', '3xl:max-h-[400px]')}
        >
          {description ? parse(description) : '暂无简介'}
        </div>
      </CardContent>
    </Card>
  )
}
