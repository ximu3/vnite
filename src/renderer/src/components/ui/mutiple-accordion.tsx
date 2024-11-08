'use client'

import * as React from 'react'
import { Accordion } from '@ui/accordion'

interface AccordionItemProps {
  value: string
  [key: string]: any
}

// 确保 type 属性永远是 "multiple"
type MultipleAccordionProps = Omit<
  React.ComponentProps<typeof Accordion>,
  'type' | 'value' | 'onValueChange'
> & {
  forceExpanded?: boolean
}

const MultipleAccordion = React.forwardRef<
  React.ElementRef<typeof Accordion>,
  MultipleAccordionProps
>(({ children, forceExpanded = true, defaultValue, ...props }, ref) => {
  const values =
    React.Children.map(children, (child) => {
      if (React.isValidElement(child) && (child.props as AccordionItemProps).value) {
        return (child.props as AccordionItemProps).value
      }
      return null
    })?.filter(Boolean) || []

  const [expandedValues, setExpandedValues] = React.useState<string[]>(
    (defaultValue as string[]) || values
  )

  React.useEffect(() => {
    if (forceExpanded) {
      setExpandedValues(values)
    }
  }, [values, forceExpanded])

  return (
    <Accordion ref={ref} type="multiple" defaultValue={expandedValues} {...props}>
      {children}
    </Accordion>
  )
})

MultipleAccordion.displayName = 'MultipleAccordion'

export { MultipleAccordion }
