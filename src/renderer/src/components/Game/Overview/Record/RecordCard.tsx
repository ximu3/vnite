import { cn } from '~/utils'

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
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-row justify-center items-center', className)}>
      <span className={cn(icon, 'w-[30px] h-[30px] mr-3')}></span>
      <div
        className={cn(
          'flex flex-col gap-1 text-xs text-accent-foreground/90 justify-center items-start'
        )}
      >
        <div className={cn('text-accent-foreground/90 self-center')}>{title}</div>
        <div
          className={cn(
            'flex text-accent-foreground flex-row gap-1 items-center justify-start text-center'
          )}
        >
          <div>{content}</div>
        </div>
      </div>
      {/* <Separator
        orientation="vertical"
        className={cn('mx-6 bg-primary h-7 self-center w-[2px] rounded-lg')}
      /> */}
    </div>
  )
}
