import * as React from 'react'
import { cn } from '~/utils'

export const InfiniteProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-lg bg-muted/50', className)}
      {...props}
    >
      <div className="animate-slide-infinite absolute h-full w-1/2 rounded-lg bg-foreground" />
    </div>
  )
})
InfiniteProgress.displayName = 'InfiniteProgress'
