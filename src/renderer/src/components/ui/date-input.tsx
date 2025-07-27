'use client'

import { cn } from '~/utils'
import { Input } from '@ui/input'
import { CalendarIcon } from 'lucide-react'
import { forwardRef } from 'react'

interface DateTimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
  mode?: 'date' | 'time' | 'datetime'
}

export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, error, mode = 'date', ...props }, ref) => {
    // Determine the input type based on the mode
    const inputType = mode === 'time' ? 'time' : mode === 'datetime' ? 'datetime-local' : 'date'

    return (
      <div className="relative">
        <Input
          type={inputType}
          max={mode === 'date' ? '9999-12-31' : undefined}
          ref={ref}
          className={cn(
            // Basic Style
            'pl-3 pr-10',
            // Remove the default date picker style
            '[&::-webkit-calendar-picker-indicator]:hidden',
            // Date and time field highlight styles
            '[&::-webkit-datetime-edit-year-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-year-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-year-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-month-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-month-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-month-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-day-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-day-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-day-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-hour-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-hour-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-hour-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-minute-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-minute-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-minute-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-second-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-second-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-second-field:focus]:rounded-lg',

            // Error Status Style
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" />
      </div>
    )
  }
)

DateTimeInput.displayName = 'DateTimeInput'
