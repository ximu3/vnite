import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@ui/dialog'
import { Textarea } from '@ui/textarea'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'

export function IntroductionDialog({ index }: { index: string }): JSX.Element {
  const [introduction, setIntroduction] = useDBSyncedState('', `games/${index}/metadata.json`, [
    'introduction'
  ])
  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('w-1/2 h-1/2 max-w-none flex flex-col gap-5')}>
        <DialogHeader className={cn('')}>
          <DialogTitle>修改简介</DialogTitle>
          <DialogDescription className={cn('text-xs')}>支持使用 HTML 标签</DialogDescription>
        </DialogHeader>
        <Textarea
          spellCheck={false}
          className={cn('grow resize-none')}
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
        />
      </DialogContent>
    </Dialog>
  )
}
