import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@ui/button'
import { StepperInput } from '@ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'

interface StorageSizeFilterProps {
  value: string[] | undefined
  onChange: (value: string[]) => void
  onClear: () => void
}

// Conversion constants
const MIB_TO_BYTES = 1024 * 1024
const GIB_TO_BYTES = 1024 * 1024 * 1024

type SizeUnit = 'mib' | 'gib'

export function StorageSizeFilter({
  value,
  onChange,
  onClear
}: StorageSizeFilterProps): React.JSX.Element {
  const { t } = useTranslation('game')

  // Parse the stored filter value
  const parseFilterValue = (
    filterValue: string[] | undefined
  ): { minBytes: number | null; maxBytes: number | null } => {
    if (!filterValue || filterValue.length === 0) {
      return { minBytes: null, maxBytes: null }
    }

    const firstValue = filterValue[0]
    if (firstValue.startsWith('range:')) {
      const parts = firstValue.split(':')
      const minStr = parts[1] || ''
      const maxStr = parts[2] || ''
      return {
        minBytes: minStr ? parseInt(minStr, 10) : null,
        maxBytes: maxStr ? parseInt(maxStr, 10) : null
      }
    }

    return { minBytes: null, maxBytes: null }
  }

  const parsed = parseFilterValue(value)

  // Determine the best unit based on current values
  const getDefaultUnit = (bytes: number | null): SizeUnit => {
    if (bytes === null) return 'gib'
    return bytes >= GIB_TO_BYTES ? 'gib' : 'mib'
  }

  const [unit, setUnit] = useState<SizeUnit>(() => {
    // Prefer the larger unit if both are set
    if (parsed.maxBytes !== null) return getDefaultUnit(parsed.maxBytes)
    if (parsed.minBytes !== null) return getDefaultUnit(parsed.minBytes)
    return 'gib'
  })

  const [minInput, setMinInput] = useState<string>(() => {
    if (parsed.minBytes === null) return ''
    const divisor = unit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES
    return String(parsed.minBytes / divisor)
  })

  const [maxInput, setMaxInput] = useState<string>(() => {
    if (parsed.maxBytes === null) return ''
    const divisor = unit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES
    return String(parsed.maxBytes / divisor)
  })

  // Update inputs when unit changes
  useEffect(() => {
    const parsed = parseFilterValue(value)
    if (parsed.minBytes !== null) {
      const divisor = unit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES
      setMinInput((parsed.minBytes / divisor).toFixed(3))
    } else {
      setMinInput('')
    }

    if (parsed.maxBytes !== null) {
      const divisor = unit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES
      setMaxInput((parsed.maxBytes / divisor).toFixed(3))
    } else {
      setMaxInput('')
    }
  }, [unit, value])

  // Convert user input to bytes and update filter
  const updateFilter = (min: string, max: string, currentUnit: SizeUnit): void => {
    const multiplier = currentUnit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES

    let minBytes: number | null = null
    let maxBytes: number | null = null

    if (min !== '' && !isNaN(parseFloat(min)) && parseFloat(min) >= 0) {
      minBytes = Math.round(parseFloat(min) * multiplier)
    }

    if (max !== '' && !isNaN(parseFloat(max)) && parseFloat(max) >= 0) {
      maxBytes = Math.round(parseFloat(max) * multiplier)
    }

    // If both are empty, clear the filter
    if (minBytes === null && maxBytes === null) {
      onClear()
      return
    }

    // Store as range:min:max format
    const filterValue = `range:${minBytes ?? ''}:${maxBytes ?? ''}`
    onChange([filterValue])
  }

  const handleUnitChange = (newUnit: string): void => {
    const typedUnit = newUnit as SizeUnit
    setUnit(typedUnit)
    // Recalculate input values for new unit
    const parsed = parseFilterValue(value)
    if (parsed.minBytes !== null) {
      const divisor = typedUnit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES
      setMinInput(String(parsed.minBytes / divisor))
    }
    if (parsed.maxBytes !== null) {
      const divisor = typedUnit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES
      setMaxInput(String(parsed.maxBytes / divisor))
    }
  }

  const hasValue = value && value.length > 0 && value[0].startsWith('range:')

  return (
    <div className="flex flex-col gap-1 items-start justify-start">
      <div className="flex flex-row justify-between items-center w-full">
        <div className="whitespace-nowrap text-sm text-foreground ml-[6px]">
          {t('filter.panel.storageSize')}
        </div>
        {hasValue && (
          <Button className="p-0 -mb-2 -mt-2" variant={'link'} onClick={onClear}>
            {t('filter.panel.clearFilter')}
          </Button>
        )}
      </div>
      <div className="flex flex-row gap-2 items-center justify-center w-full">
        <StepperInput
          min={0}
          steps={
            unit === 'gib'
              ? { default: 0.1, shift: 1, alt: 5, ctrl: 10 }
              : { default: 128, shift: 512, alt: 1024, ctrl: 1024 }
          }
          placeholder={t('filter.panel.storageSizeMin')}
          value={minInput}
          onChange={(e) => updateFilter(e.target.value, maxInput, unit)}
          inputClassName="pr-4"
          className="w-full h-8 text-sm"
        />
        <span className="text-sm text-muted-foreground">-</span>
        <StepperInput
          min={0}
          steps={
            unit === 'gib'
              ? { default: 0.1, shift: 1, alt: 5, ctrl: 10 }
              : { default: 128, shift: 512, alt: 1024, ctrl: 1024 }
          }
          placeholder={t('filter.panel.storageSizeMax')}
          value={maxInput}
          onChange={(e) => updateFilter(minInput, e.target.value, unit)}
          inputClassName="pr-4"
          className="w-full h-8 text-sm"
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mib">{t('filter.panel.mib')}</SelectItem>
            <SelectItem value="gib">{t('filter.panel.gib')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
