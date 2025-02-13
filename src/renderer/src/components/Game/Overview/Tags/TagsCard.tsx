import { Separator } from '@ui/separator'
import React from 'react'
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
  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center select-none')}>
        <div>标签</div>
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
