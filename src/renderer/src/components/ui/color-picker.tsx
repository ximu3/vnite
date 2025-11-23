import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { converter, parse } from 'culori'
import { useState } from 'react'
import { HslColorPicker } from 'react-colorful'
import { cn } from '~/utils'

type HSL = { h: number; s: number; l: number }

interface ColorPickerProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

const toHsl = converter('hsl')

function cssToHsl(css: string): HSL {
  const parsed = parse(css)
  if (!parsed) return { h: 0, s: 100, l: 50 }
  const hsl = toHsl(parsed)
  return { h: hsl.h ?? 0, s: (hsl.s ?? 1) * 100, l: (hsl.l ?? 0.5) * 100 }
}

function ColorPicker({ value, onChange, className }: ColorPickerProps): React.JSX.Element {
  const [hsl, setHsl] = useState<HSL>(cssToHsl(value))

  const handleChange = (newHsl: HSL): void => {
    setHsl(newHsl)
    onChange?.(`hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`)
  }

  return (
    <Popover>
      <PopoverTrigger className={cn('w-6 h-6', className)}>
        <div
          className={cn(
            'w-full h-full rounded-full cursor-pointer',
            'transition-all duration-150 hover:ring-1 hover:ring-primary'
          )}
          style={{ background: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)` }}
        />
      </PopoverTrigger>

      <PopoverContent className="p-3">
        <HslColorPicker
          color={hsl}
          onChange={handleChange}
          style={{
            width: '100%',
            height: 200
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker }
