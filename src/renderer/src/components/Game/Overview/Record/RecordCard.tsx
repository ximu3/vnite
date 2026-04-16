import React from 'react'
import { Button } from '~/components/ui/button'
import { PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/utils'

interface RecordCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  title: string
  content: string
  icon?: string
  onClick?: () => void
  asPopoverTrigger?: boolean
  className?: string
}

export const RecordCard = React.forwardRef<HTMLDivElement, RecordCardProps>(function RecordCard(
  { title, content, icon, onClick, asPopoverTrigger, className = '', ...props },
  ref
): React.JSX.Element {
  const ButtonWrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element =>
    asPopoverTrigger ? <PopoverTrigger asChild>{children}</PopoverTrigger> : <>{children}</>
  const isInteractive = onClick || asPopoverTrigger

  return (
    <div
      ref={ref}
      className={cn('flex flex-row justify-center items-center', className)}
      {...props}
    >
      {isInteractive ? (
        <ButtonWrapper>
          <Button variant={'bare'} size={'icon'} className={cn('group  mr-3')} onClick={onClick}>
            <span className={cn(icon, 'group-hover:text-primary')}></span>
          </Button>
        </ButtonWrapper>
      ) : (
        <span className={cn(icon, 'mr-3')}></span>
      )}

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
    </div>
  )
})

RecordCard.displayName = 'RecordCard'
