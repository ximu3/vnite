import * as React from 'react'

import { cn } from '~/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      data-slot="textarea"
      spellCheck="false"
      className={cn(
        'scrollbar-base-thin placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/[calc(var(--glass-opacity)/2)] flex field-sizing-content min-h-16 w-full rounded-md bg-transparent px-3 py-2 text-base shadow-sm transition-[color_box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
