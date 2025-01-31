'use client'

import { cn } from '~/utils'
import { Input } from '@ui/input'
import { CalendarIcon } from 'lucide-react'
import { forwardRef } from 'react'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          type="date"
          max={'9999-12-31'}
          ref={ref}
          className={cn(
            // Basic Style
            'pl-3 pr-10',
            // Remove the default date picker style
            '[&::-webkit-calendar-picker-indicator]:hidden',
            // Year field highlighting style
            '[&::-webkit-datetime-edit-year-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-year-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-year-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-month-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-month-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-month-field:focus]:rounded-lg',

            '[&::-webkit-datetime-edit-day-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-day-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-day-field:focus]:rounded-lg',
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
DateInput.displayName = 'DateInput'
