import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { IntroductionDialog } from './IntroductionDialog'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import parse from 'html-react-parser'

export function IntroductionCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [introduction] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['introduction'])
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>简介</div>
            <IntroductionDialog gameId={gameId} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div
          className={cn('max-h-[300px] text-sm overflow-auto scrollbar-base', '3xl:max-h-[400px]')}
        >
          {introduction ? parse(introduction) : '暂无简介'}
        </div>
      </CardContent>
    </Card>
  )
}
