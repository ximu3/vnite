import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { useConfigLocalState } from '~/hooks'
import { cn } from '~/utils'

const DEFAULT_SCALES = [0, 2, 3, 4]

type UpscaleSelectTriggerA11yProps = Pick<
  React.ComponentPropsWithoutRef<typeof SelectTrigger>,
  'aria-label' | 'aria-labelledby'
>

interface UpscaleSelectProps extends UpscaleSelectTriggerA11yProps {
  value: number
  onValueChange: (value: number) => void
  triggerClassName?: string
  id?: string
  scales?: number[]
}

interface UpscaleSelectFieldProps extends UpscaleSelectProps {
  className?: string
  labelClassName?: string
}

interface UpscaleSelectRowProps extends UpscaleSelectProps {
  labelClassName?: string
}

const useUpscalerConfigured = (): boolean => {
  const [upscalerPath] = useConfigLocalState('game.linkage.upscaler.path')
  return !!upscalerPath
}

const UpscaleSelectBase = ({
  value,
  onValueChange,
  triggerClassName,
  id,
  scales = DEFAULT_SCALES,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby
}: UpscaleSelectProps): React.JSX.Element => {
  const { t } = useTranslation('utils')

  return (
    <Select value={String(value)} onValueChange={(val) => onValueChange(Number(val))}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={cn('w-[100px] h-8 text-sm', triggerClassName)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {scales.map((scale) =>
          scale === 0 ? (
            <SelectItem key="0" value="0">
              {t('upscale.noUpscale')}
            </SelectItem>
          ) : (
            <SelectItem key={String(scale)} value={String(scale)}>
              {scale}x
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  )
}

export function UpscaleSelect(props: UpscaleSelectProps): React.JSX.Element | null {
  if (!useUpscalerConfigured()) return null
  return <UpscaleSelectBase {...props} />
}

export function UpscaleSelectField({
  className,
  labelClassName,
  ...props
}: UpscaleSelectFieldProps): React.JSX.Element | null {
  const { t } = useTranslation('utils')
  const generatedId = React.useId()
  const selectId = props.id ?? generatedId
  if (!useUpscalerConfigured()) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label htmlFor={selectId} className={cn('whitespace-nowrap', labelClassName)}>
        {t('upscale.label')}
      </Label>
      <UpscaleSelectBase {...props} id={selectId} />
    </div>
  )
}

export function UpscaleSelectRow({
  labelClassName,
  ...props
}: UpscaleSelectRowProps): React.JSX.Element | null {
  const { t } = useTranslation('utils')
  const generatedId = React.useId()
  const selectId = props.id ?? generatedId
  if (!useUpscalerConfigured()) return null

  return (
    <>
      <Label
        htmlFor={selectId}
        className={cn('whitespace-nowrap justify-self-start', labelClassName)}
      >
        {t('upscale.label')}
      </Label>
      <UpscaleSelectBase {...props} id={selectId} />
    </>
  )
}
