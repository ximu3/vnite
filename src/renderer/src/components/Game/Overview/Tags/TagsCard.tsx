import { Separator } from '@ui/separator'
import React from 'react'
import { toast } from 'sonner'
import { useDBSyncedState } from '~/hooks'
import { cn } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { TagsDialog } from './TagsDialog'

export function TagsCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [tags] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['tags'])
  const handleCopy = (): void => {
    navigator.clipboard
      .writeText(`${tags}`)
      .then(() => {
        toast.success('已复制到剪切板', { duration: 1000 })
      })
      .catch((error) => {
        toast.error(`复制文本到剪切板失败: ${error}`)
      })
  }
  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('select-none cursor-pointer')} onClick={handleCopy}>
          标签
        </div>
        <TagsDialog gameId={gameId} />
      </div>
      <Separator className={cn('my-3 bg-primary')} />
      <div className={cn('text-sm justify-start items-start')}>
        <div className={cn('flex flex-wrap gap-x-1 gap-y-1')}>
          {tags.join(', ') === ''
            ? '暂无标签'
            : tags.map((tag) => (
                <React.Fragment key={tag}>
                  <FilterAdder filed="tags" value={tag} className={cn('')} />
                </React.Fragment>
              ))}
        </div>
      </div>
    </div>
  )
}
