import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { CheckIcon } from 'lucide-react'

import { cn } from '~/utils'

interface CheckboxesProps {
  value: string[]
  values: { label: string; value: string }[]
  onChange: (value: string[]) => void
  className?: string
}

function Checkboxes({ value, className, ...props }: CheckboxesProps): React.JSX.Element {
  const [valueArray, setValue] = React.useState(value)

  const handleCheckboxChange = (
    checkedValue: string,
    checked: CheckboxPrimitive.CheckedState
  ): void => {
    if (checked) {
      const newValue = [...valueArray, checkedValue]
      setValue(newValue)
      props.onChange(newValue)
    } else {
      const newValue = value.filter((v) => v !== checkedValue)
      setValue(newValue)
      props.onChange(newValue)
    }
  }
  return (
    <React.Fragment>
      <div className={cn('w-full flex flex-row shadow-sm rounded-md', className)}>
        {props.values.map((option) => (
          <div key={option.value}>
            <CheckboxPrimitive.Root
              data-slot="checkbox"
              className="peer dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={option.value}
              checked={valueArray.includes(option.value)}
              onCheckedChange={(checked) => {
                handleCheckboxChange(option.value, checked)
              }}
            >
              <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="flex items-center justify-center text-current transition-none"
              >
                <CheckIcon className="size-3.5" />
              </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
            <label className="pr-5">{option.label}</label>
          </div>
        ))}
      </div>
    </React.Fragment>
  )
}

export { Checkboxes }
