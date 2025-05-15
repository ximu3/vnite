import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '~/utils'

interface NavProps {
  to: string
  children: React.ReactNode
  variant?: 'default' | 'gameList' | 'sidebar' | 'librarybar'
  className?: string
}

export function Nav({
  to,
  children,
  className,
  variant = 'default',
  ...props
}: NavProps): JSX.Element {
  return (
    <NavLink to={to}>
      {({ isActive }) => {
        const baseStyles =
          'p-2 rounded-md text-sm font-medium w-full h-full flex flex-row gap-1 justify-start items-center non-draggable'
        let variantStyles = ''

        switch (variant) {
          case 'gameList':
            variantStyles = isActive
              ? 'bg-accent text-accent-foreground rounded-none'
              : 'hover:bg-accent rounded-none'
            break
          case 'sidebar':
            variantStyles = isActive
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
            break
          case 'librarybar':
            variantStyles = isActive
              ? 'bg-accent/[0.7] text-accent-foreground border-[1px] border-input shadow-sm'
              : 'hover:bg-accent/[0.7] hover:text-accent-foreground shadow-sm bg-background/[0.3] text-background-foreground border-[1px] border-input shadow-sm'
            break
          default:
            variantStyles = isActive
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-primary hover:text-primary-foreground'
        }

        return (
          <div className={cn(baseStyles, variantStyles, className)} {...props}>
            {children}
          </div>
        )
      }}
    </NavLink>
  )
}
