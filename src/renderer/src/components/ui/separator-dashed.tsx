import { cn } from '~/utils'

export function SeparatorDashed({ className }: { className?: string }): React.JSX.Element {
  return (
    <div className={cn('flex items-center justify-center flex-grow')}>
      <div className={cn('w-full h-px my-3 border-t border-dashed border-primary', className)} />
    </div>
  )
}
