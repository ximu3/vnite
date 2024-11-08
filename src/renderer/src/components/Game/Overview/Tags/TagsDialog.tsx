import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { ArrayInput } from '~/components/ui/array-input'

export function TagsDialog({ gameId }: { gameId: string }): JSX.Element {
  const [tags, setTags] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['tags'])

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('w-1/3 h-1/3 max-w-none flex flex-col gap-5')}>
        <div className={cn('text-xs -mb-2')}>标签之间使用逗号分隔</div>
        <ArrayInput
          className={cn('grow resize-none')}
          value={tags}
          onChange={setTags}
          placeholder="暂无标签"
          isTextarea
          isHaveTooltip={false}
        />
      </DialogContent>
    </Dialog>
  )
}
