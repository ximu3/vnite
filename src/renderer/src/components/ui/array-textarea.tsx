'use client'

import React, { useCallback } from 'react'
import { Textarea } from '@ui/textarea'

interface ArrayTextareaProps {
  value: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  className?: string
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void
}

export function ArrayTextarea({
  value = [],
  onChange,
  placeholder,
  className,
  onBlur
}: ArrayTextareaProps): React.JSX.Element {
  // Converting arrays to text
  const arrayToText = useCallback((arr: string[]) => {
    return arr.join('\n')
  }, [])

  // Convert text to an array, preserving blank lines and spaces
  const textToArray = useCallback((text: string) => {
    return text.split('\n')
  }, [])

  // Handling text changes
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newText = event.target.value
    const newArray = textToArray(newText)
    onChange?.(newArray)
  }

  return (
    <Textarea
      spellCheck={false}
      value={arrayToText(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      onBlur={onBlur}
    />
  )
}
