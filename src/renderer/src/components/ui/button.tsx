import { cva, type VariantProps } from 'class-variance-authority'
import { Slot as SlotPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '~/utils'

const buttonVariants = cva(
  "inline-flex non-draggable items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        delete:
          'dark:bg-input/[calc(var(--glass-opacity)/2)] dark:hover:bg-destructive/[calc(var(--glass-opacity))] shadow-sm text-background-foreground hover:text-destructive-foreground hover:bg-destructive/[calc(var(--glass-opacity)/3)]',
        outline:
          'dark:bg-input/[calc(var(--glass-opacity)/2)] dark:hover:bg-accent/[calc(var(--glass-opacity))] shadow-sm text-background-foreground hover:text-accent-foreground hover:bg-accent/[calc(var(--glass-opacity)/3)]',
        thirdary:
          'dark:bg-input/[calc(var(--glass-opacity)/2)] dark:hover:bg-accent/[calc(var(--glass-opacity))] shadow-sm text-background-foreground hover:text-accent-foreground hover:bg-accent/[calc(var(--glass-opacity)/3)]',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/[calc(var(--glass-opacity)*2)]',
        link: 'text-background-foreground underline-offset-4 hover:underline',
        bare: 'bg-transparent shadow-none hover:bg-transparent'
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-4'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }): React.JSX.Element {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// eslint-disable-next-line
export { Button, buttonVariants }
