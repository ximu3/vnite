import { Link, LinkProps } from '@tanstack/react-router'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { forwardRef } from 'react'
import { cn } from '~/utils'

const navVariants = cva(
  'non-draggable inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'hover:text-accent-foreground hover:bg-accent/[calc(var(--glass-opacity)*2)]',
        sidebar:
          'hover:text-accent-foreground min-h-0 min-w-0 p-2 hover:bg-accent/[calc(var(--glass-opacity)*2)]',
        gameList:
          'hover:text-accent-foreground relative hover:bg-accent/[calc(var(--glass-opacity)*2)]',
        librarybar:
          'dark:bg-input/[calc(var(--glass-opacity)/2)] dark:hover:bg-accent/[calc(var(--glass-opacity))] hover:text-accent-foreground shadow-sm hover:bg-accent/[calc(var(--glass-opacity)/3)]'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface NavProps extends LinkProps, VariantProps<typeof navVariants> {
  className?: string
  children?: React.ReactNode
}

const Nav = forwardRef<HTMLAnchorElement, NavProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(navVariants({ variant, size, className }))}
        activeProps={{
          className: '!bg-accent/[calc(var(--glass-opacity)*2)] !text-accent-foreground !shadow-sm'
        }}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

Nav.displayName = 'Nav'

export { Nav }
