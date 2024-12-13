import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { useDBSyncedState } from '~/hooks'
import { TagsDialog } from './TagsDialog'
import { FilterAdder } from '../../FilterAdder'
import React from 'react'

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
            'text-sm justify-start items-start overflow-auto scrollbar-base sm:max-h-[5vh] max-h-[54px] -mb-2'
          )}
        >
          <div className={cn('flex flex-wrap mb-[8px]')}>
            {tags.join(', ') === ''
              ? '暂无标签'
              : tags.map((tag, index) => (
                  <React.Fragment key={tag}>
                    <FilterAdder filed="tags" value={tag} className={cn('')} />
                    {index < tags.length - 1 && (
                      <span className="text-primary align-top">{', '}</span>
                    )}
                  </React.Fragment>
                ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
