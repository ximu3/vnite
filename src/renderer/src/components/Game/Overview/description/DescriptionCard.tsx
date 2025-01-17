import { Separator } from '@ui/separator'
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
    <div className={cn('bg-transparent border-0 shadow-none', className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold')}>简介</div>
        <DescriptionDialog gameId={gameId} />
      </div>
      <Separator className={cn('my-3 bg-primary')} />

      <div
        className={cn(
          'text-sm',
          'prose-a:text-primary', // Link Color
          'prose-a:no-underline hover:prose-a:underline', // underline effect
          'space-before-0',
          'whitespace-pre-line'
        )}
      >
        {description ? parse(description, HTMLParserOptions) : '暂无简介'}
      </div>
    </div>
  )
}
