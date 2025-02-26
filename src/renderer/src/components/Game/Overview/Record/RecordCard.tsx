import { cn } from '~/utils'
import { Separator } from '@ui/separator'

export function RecordCard({
  title,
  content,
  icon,
  className = ''
}: {
  title: string
  content: string
  icon?: string
  className?: string
}): JSX.Element {
  return (
    <div className={cn('flex flex-row justify-center items-center', className)}>
      <div
        className={cn(
          'flex flex-col gap-1 text-xs text-accent-foreground/90 justify-center items-center'
        )}
      >
        <div className={cn('font-bold text-accent-foreground self-center')}>{title}</div>
        <div className={cn('flex flex-row gap-1 items-center justify-start text-center')}>
          <span className={cn(icon)}></span>
          <div>{content}</div>
        </div>
      </div>
      <Separator
        orientation="vertical"
        className={cn('mx-6 bg-primary h-7 self-center w-[2px] rounded-lg')}
      />
    </div>
  )
}
