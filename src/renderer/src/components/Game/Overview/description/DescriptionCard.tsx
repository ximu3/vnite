import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { DescriptionDialog } from './DescriptionDialog'
import { cn, HTMLParserOptions } from '~/utils'
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
          className={cn(
            'max-h-[310px] text-sm overflow-auto scrollbar-base',
            '3xl:max-h-[500px]',
            'prose-a:text-primary', // 链接颜色
            'prose-a:no-underline hover:prose-a:underline' // 下划线效果
          )}
        >
          {description ? parse(description, HTMLParserOptions) : '暂无简介'}
        </div>
      </CardContent>
    </Card>
  )
}
