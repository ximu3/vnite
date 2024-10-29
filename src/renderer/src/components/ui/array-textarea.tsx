'use client'

import React, { useCallback } from 'react'
import { Textarea } from '@ui/textarea'

interface ArrayTextareaProps {
  value: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function ArrayTextarea({
  value = [],
  onChange,
  placeholder,
  className
}: ArrayTextareaProps): JSX.Element {
  // 将数组转换为文本
  const arrayToText = useCallback((arr: string[]) => {
    return arr.join('\n')
  }, [])

  // 将文本转换为数组，保留空行和空格
  const textToArray = useCallback((text: string) => {
    return text.split('\n') // 只按换行符分割，保留所有空格和空行
  }, [])

  // 处理文本改变
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
    />
  )
}
