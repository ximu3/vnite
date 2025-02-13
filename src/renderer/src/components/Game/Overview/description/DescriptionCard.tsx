import { Separator } from '@ui/separator'
import parse from 'html-react-parser'
import { toast } from 'sonner'
import { useDBSyncedState } from '~/hooks'
import { cn, HTMLParserOptions } from '~/utils'
import { DescriptionDialog } from './DescriptionDialog'

export function DescriptionCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [description] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['description'])

  const handleCopy = (): void => {
    navigator.clipboard
      .writeText(description)
      .then(() => {
        toast.success('已复制到剪切板', { duration: 1000 })
      })
      .catch((error) => {
        toast.error(`复制文本到剪切板失败: ${error}`)
      })
  }
  return (
    <div className={cn('bg-transparent border-0 shadow-none', className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none cursor-pointer')} onClick={handleCopy}>
          简介
        </div>
        <DescriptionDialog gameId={gameId} />
      </div>
      <Separator className={cn('my-3 bg-primary')} />

      <div
        className={cn(
          'text-sm',
          'prose-a:text-primary', // Link Color
          'prose-a:no-underline hover:prose-a:underline', // underline effect
          'space-before-0',
          'whitespace-pre-line',
          'leading-7'
        )}
      >
        {description ? parse(description, HTMLParserOptions) : '暂无简介'}
      </div>
    </div>
  )
}
