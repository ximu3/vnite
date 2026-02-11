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

interface StepperInputProps extends InputProps {
  inputClassName?: string
  min?: number
  max?: number
  steps?: {
    default: number
    shift?: number
    ctrl?: number
    alt?: number
  }
}

function Input({ className, type, ...props }: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      type={type}
      data-slot="input"
      spellCheck="false"
      className={cn(
        'non-draggable border-0 shadow-sm file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/[calc(var(--glass-opacity)/2)] flex h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-base transition-[color_box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border aria-invalid:focus:border-transparent aria-invalid:border-destructive',
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

const StepperInput = React.forwardRef<HTMLInputElement, StepperInputProps>(
  (
    { className, inputClassName, steps = { default: 1 }, min, max, value, onChange, ...props },
    ref
  ) => {
    const numericValue = Number(value) || 0

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      // NOTE: can't handle scientific notation input such as `2e6`
      let value = Number(e.target.value)

      if (min !== undefined && value < min) value = min
      if (max !== undefined && value > max) value = max

      onChange?.({ ...e, target: { ...e.target, value: String(value) } })
    }

    const handleStep = (direction: 1 | -1, e?: React.MouseEvent | React.KeyboardEvent): void => {
      let step = steps?.default ?? 1
      if (e) {
        if (e.shiftKey) step = steps?.shift ?? step
        else if (e.ctrlKey) step = steps?.ctrl ?? step
        else if (e.altKey) step = steps?.alt ?? step
      }

      const newValue = numericValue + step * direction
      const event = {
        target: { value: String(newValue) }
      } as React.ChangeEvent<HTMLInputElement>
      handleChange(event)
    }

    return (
      <div className={cn('relative w-full group', className)}>
        <Input
          ref={ref}
          type="number"
          value={value}
          onChange={handleChange}
          className={cn(
            'pr-10 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            inputClassName
          )}
          {...props}
        />
        <div
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 hidden group-focus-within:flex flex-col z-10',
            'bg-popover/(--glass-opacity) backdrop-filter backdrop-blur-[32px] rounded-md'
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 p-0 flex items-center justify-center"
            onClick={(e) => handleStep(1, e)}
          >
            <span className="icon-[mdi--keyboard-arrow-up] w-5 h-5"></span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 p-0 flex items-center justify-center"
            onClick={(e) => handleStep(-1, e)}
          >
            <span className="icon-[mdi--keyboard-arrow-down] w-5 h-5"></span>
          </Button>
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'
ClearableInput.displayName = 'ClearableInput'
StepperInput.displayName = 'StepperInput'

export { ClearableInput, Input, StepperInput }
