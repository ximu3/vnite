import { cn } from '~/utils'
import { ScrollArea } from '@ui/scroll-area'
import { Collections } from './Collections'

export function CollectionPage(): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-3 h-[100vh] pt-[30px]')}>
      <ScrollArea className={cn('w-full')}>
        <Collections />
      </ScrollArea>
    </div>
  )
}
