import React, {
  ChangeEvent,
  CompositionEvent,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react'
import { Input } from '@ui/input'
import { Textarea } from '@ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { cn } from '~/utils'

interface ArrayInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  tooltipText?: string
  className?: string
  isTextarea?: boolean
  isHaveTooltip?: boolean
}

export function ArrayInput({
  value,
  onChange,
  placeholder,
  tooltipText,
  className,
  isTextarea,
  isHaveTooltip = true,
  onBlur = () => {}
}: ArrayInputProps): React.JSX.Element {
  // Use useMemo to initialize inputValue to avoid unnecessary join operations.
  const initialInputValue = useMemo(() => value.join(', '), [])
  const [inputValue, setInputValue] = useState(initialInputValue)
  const [isComposing, setIsComposing] = useState(false)

  // Delayed update of arrays using anti-aliasing
  const debouncedUpdateArray = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (newValue: string): any => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          const endsWithComma = newValue.endsWith(',')
          const newArray = newValue
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v !== '')
          const uniqueArray = [...new Set(newArray)]
          if (endsWithComma && newArray[newArray.length - 1] !== '') {
            uniqueArray.push('')
          }
          onChange(uniqueArray)
        }, 1)
      }
    })(),
    [onChange]
  )

  // Update inputValue only when there is a meaningful change to the external value.
  useEffect(() => {
    const newInputValue = value.join(', ')
    if (newInputValue !== inputValue && !isComposing) {
      setInputValue(newInputValue)
    }
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (!isComposing) {
      debouncedUpdateArray(newValue)
    }
  }

  const handleCompositionStart = (): void => {
    setIsComposing(true)
  }

  const handleCompositionEnd = (
    e: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setIsComposing(false)
    const newValue = e.currentTarget.value
    setInputValue(newValue)
    debouncedUpdateArray(newValue)
  }

  const InputComponent = isTextarea ? Textarea : Input

  const inputElement = (
    <InputComponent
      value={inputValue}
      onChange={handleChange}
      onBlur={onBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder={placeholder}
      className={cn('bg-background/[0.5]', className)}
    />
  )

  return (
    <React.Fragment>
      {isHaveTooltip ? (
        <Tooltip>
          <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
            {inputElement}
          </TooltipTrigger>
          {tooltipText && (
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{tooltipText}</div>
            </TooltipContent>
          )}
        </Tooltip>
      ) : (
        inputElement
      )}
    </React.Fragment>
  )
}
