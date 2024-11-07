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
            // 基础样式
            'pl-3 pr-10',
            // 移除默认的日期选择器样式
            '[&::-webkit-calendar-picker-indicator]:hidden',
            // 年份字段高亮样式
            '[&::-webkit-datetime-edit-year-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-year-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-year-field:focus]:rounded-[0.3rem]',

            '[&::-webkit-datetime-edit-month-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-month-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-month-field:focus]:rounded-[0.3rem]',

            '[&::-webkit-datetime-edit-day-field:focus]:bg-primary',
            '[&::-webkit-datetime-edit-day-field:focus]:text-primary-foreground',
            '[&::-webkit-datetime-edit-day-field:focus]:rounded-[0.3rem]',
            // 错误状态样式
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
