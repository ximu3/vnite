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
              : 'hover:bg-accent hover:text-accent-foreground rounded-none'
            break
          case 'sidebar':
            variantStyles = isActive
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
            break
          case 'librarybar':
            variantStyles = isActive
              ? 'bg-accent text-accent-foreground border-[1px] border-border'
              : 'hover:bg-accent hover:text-accent-foreground bg-background text-background-foreground border-[1px] border-border'
            break
          default: // 'default'
            variantStyles = isActive
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-primary hover:text-primary-foreground'
        }

        return (
          <div
            className={cn(baseStyles, variantStyles, className)} // 保留传入的 className
            {...props}
          >
            {children}
          </div>
        )
      }}
    </NavLink>
  )
}
