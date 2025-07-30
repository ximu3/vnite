import * as React from 'react'

import { cn } from '~/utils'
import { Button } from './button'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost'
}

export interface ClearableInputProps extends InputProps {
  inputClassName?: string
  onClear?: () => void
}

function Input({ className, type, ...props }: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      type={type}
      data-slot="input"
      spellCheck="false"
      className={cn(
        'non-draggable border-0 shadow-sm file:text-foreground placeholder:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/[calc(var(--glass-opacity)/2)] flex h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ className, inputClassName, type, onClear, value, onChange, ...props }, ref) => {
    // Handle clearing input content
    const handleClear = (e: React.MouseEvent): void => {
      e.preventDefault()
      e.stopPropagation()

      if (onClear) {
        onClear()
      } else if (onChange) {
        // Create a synthetic event to pass to onChange
        const event = {
          target: {
            value: ''
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }

    // Check if clear button should be shown
    const hasValue = Boolean(value)
    const showClearButton = hasValue

    return (
      <div className={cn('relative w-full shadow-sm rounded-md', className)}>
        <Input
          type={type}
          className={cn(showClearButton ? 'pr-8' : '', inputClassName, 'shadow-none bg-input/30')}
          value={value}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        {showClearButton && (
          <Button
            className="absolute w-[14px] h-[14px] p-0 transform -translate-y-1/2 right-2 top-1/2"
            onClick={handleClear}
            tabIndex={-1}
            variant={'outline'}
          >
            <span className="icon-[mdi--close] w-[10px] h-[10px]"></span>
          </Button>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
ClearableInput.displayName = 'ClearableInput'

export { ClearableInput, Input }
