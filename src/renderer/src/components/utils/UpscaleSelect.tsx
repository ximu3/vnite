import { useTranslation } from 'react-i18next'
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

interface UpscaleSelectProps {
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
  scales = DEFAULT_SCALES
}: UpscaleSelectProps): React.JSX.Element => {
  const { t } = useTranslation('utils')

  return (
    <Select value={String(value)} onValueChange={(val) => onValueChange(Number(val))}>
      <SelectTrigger id={id} className={cn('w-[100px] h-8 text-sm', triggerClassName)}>
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
  if (!useUpscalerConfigured()) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('text-sm whitespace-nowrap', labelClassName)}>{t('upscale.label')}</span>
      <UpscaleSelectBase {...props} />
    </div>
  )
}

export function UpscaleSelectRow({
  labelClassName,
  ...props
}: UpscaleSelectRowProps): React.JSX.Element | null {
  const { t } = useTranslation('utils')
  if (!useUpscalerConfigured()) return null

  return (
    <>
      <div className={cn('whitespace-nowrap select-none justify-self-start', labelClassName)}>
        {t('upscale.label')}
      </div>
      <UpscaleSelectBase {...props} />
    </>
  )
}
