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

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', value, onChange, ...props }, ref) => {
    return (
      <input
        spellCheck="false"
        type={type}
        className={cn(
          'flex h-9 w-full non-draggable rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'ghost' &&
            'border-0 bg-transparent hover:bg-accent transition-none focus:hover:bg-transparent truncate shadow-none',
          className
        )}
        value={value}
        onChange={onChange}
        ref={ref}
        {...props}
      />
    )
  }
)

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  (
    { className, inputClassName, type, variant = 'default', onClear, value, onChange, ...props },
    ref
  ) => {
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
      <div className={cn('relative w-full shadow-sm', className)}>
        <Input
          type={type}
          className={cn(showClearButton ? 'pr-8' : '', inputClassName)}
          value={value}
          onChange={onChange}
          ref={ref}
          variant={variant}
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
