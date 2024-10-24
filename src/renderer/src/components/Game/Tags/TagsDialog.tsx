import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Textarea } from '@ui/textarea'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { ChangeEvent } from 'react'

export function TagsDialog({ gameId }: { gameId: string }): JSX.Element {
  const [tags, setTags] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['tags'])
  const handleTagsChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value
    const endsWithComma = value.endsWith(',')

    const newTags = value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '')

    const uniqueTags = [...new Set(newTags)]

    if (endsWithComma && newTags[newTags.length - 1] !== '') {
      uniqueTags.push('')
    }

    setTags(uniqueTags)
  }
  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('w-1/3 h-1/3 max-w-none flex flex-col gap-5')}>
        <div className={cn('text-xs -mb-2')}>标签之间使用逗号分隔</div>
        <Textarea
          spellCheck={false}
          className={cn('grow resize-none')}
          value={tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="请输入标签"
        />
      </DialogContent>
    </Dialog>
  )
}
