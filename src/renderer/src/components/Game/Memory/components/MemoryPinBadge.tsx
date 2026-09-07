import { cn } from '~/utils'

export function MemoryPinBadge(): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-0 left-0 z-30 size-2 bg-primary',
        '[clip-path:polygon(0_0,100%_0,0_100%)]'
      )}
    />
  )
}
