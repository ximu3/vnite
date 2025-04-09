import * as React from 'react'
import { cn } from '~/utils'
import { Button } from './button'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost'
  showClear?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, variant = 'default', showClear = false, onClear, value, onChange, ...props },
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
    const hasValue = value !== undefined && value !== null && value !== ''
    const showClearButton = showClear && hasValue

    return (
      <div className="relative w-full">
        <input
          spellCheck="false"
          type={type}
          className={cn(
            'flex h-9 w-full non-draggable rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'ghost' &&
              'border-0 bg-transparent hover:bg-accent transition-none focus:hover:bg-transparent truncate shadow-none',
            showClearButton ? 'pr-8' : '',
            className
          )}
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

export { Input }
