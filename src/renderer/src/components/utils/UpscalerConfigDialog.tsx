import {
  getUpscalerBackendByPath,
  getUpscalerDenoiseLevelOptions,
  getUpscalerModelOptions,
  getUpscalerScaleOptions,
  setUpscalerConfigOptions,
  type GameImageUpscaleOptions,
  type UpscalerBackend
} from '@appTypes/utils'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState } from '~/hooks'

interface UpscalerConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void | Promise<void>
}

export function UpscalerConfigDialog({
  open,
  onOpenChange,
  onConfirm
}: UpscalerConfigDialogProps): React.JSX.Element {
  const { t } = useTranslation('config')
  const [upscalerPath] = useConfigLocalState('game.linkage.upscaler.path')
  const [upscalerConfig, setUpscalerConfig] = useConfigLocalState('game.linkage.upscaler.config')
  const resolvedUpscalerPath = (upscalerPath ?? '').trim()
  const detectedBackend = getUpscalerBackendByPath(resolvedUpscalerPath)
  const [isTesting, setIsTesting] = React.useState(false)
  const [isConfirming, setIsConfirming] = React.useState(false)
  const pendingSaveRef = React.useRef<Promise<void>>(Promise.resolve())
  const currentOptions = detectedBackend ? upscalerConfig[detectedBackend] : null

  const handleValueChange = React.useCallback(
    async (backend: UpscalerBackend, value: Parameters<typeof setUpscalerConfigOptions>[2]) => {
      const savePromise = setUpscalerConfig(
        setUpscalerConfigOptions(upscalerConfig, backend, value)
      )
      pendingSaveRef.current = savePromise
      await savePromise
    },
    [setUpscalerConfig, upscalerConfig]
  )

  const handleTest = React.useCallback(async () => {
    if (!currentOptions) {
      return
    }

    setIsTesting(true)
    toast.promise(
      async () => {
        try {
          await pendingSaveRef.current
          await ipcManager.invoke('utils:test-upscaler')
        } finally {
          setIsTesting(false)
        }
      },
      {
        loading: t('advanced.upscaler.dialog.testing'),
        success: t('advanced.upscaler.dialog.testSuccess'),
        error: (error) =>
          t('advanced.upscaler.dialog.testError', {
            message: error.message
          })
      }
    )
  }, [currentOptions, t])

  const handleConfirm = React.useCallback(async () => {
    if (!onConfirm) {
      return
    }

    setIsConfirming(true)
    try {
      await pendingSaveRef.current
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }, [onConfirm])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('advanced.upscaler.dialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>{t('advanced.upscaler.dialog.backendLabel')}</Label>
            {detectedBackend ? (
              <Input
                value={getUpscalerBackendLabel(detectedBackend)}
                readOnly
                className="pointer-events-none"
              />
            ) : (
              <div className="rounded-md border border-dashed px-3 py-2.5 text-sm">
                <div className="text-muted-foreground">
                  {t('advanced.upscaler.dialog.backendHint')}
                </div>
              </div>
            )}
          </div>

          {detectedBackend && currentOptions && (
            <UpscaleOptionsEditor
              backend={detectedBackend}
              value={currentOptions}
              onValueChange={(value) => void handleValueChange(detectedBackend, value)}
            />
          )}
        </div>

        <DialogFooter className={onConfirm ? 'sm:justify-between' : undefined}>
          <Button
            variant="outline"
            onClick={() => void handleTest()}
            disabled={currentOptions === null || isTesting || isConfirming}
          >
            {t('advanced.upscaler.dialog.test')}
          </Button>
          {onConfirm && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
                {t('utils:common.cancel')}
              </Button>
              <Button
                onClick={() => void handleConfirm()}
                disabled={currentOptions === null || isTesting || isConfirming}
              >
                {t('utils:common.confirm')}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getUpscalerBackendLabel(backend: UpscalerBackend): string {
  switch (backend) {
    case 'waifu2x':
      return 'waifu2x-ncnn-vulkan'
    case 'realcugan':
      return 'realcugan-ncnn-vulkan'
    case 'realesrgan':
      return 'realesrgan-ncnn-vulkan'
  }
}

interface UpscaleOptionsEditorProps {
  backend: UpscalerBackend
  value: GameImageUpscaleOptions
  onValueChange: (value: GameImageUpscaleOptions) => void
}

type ResolvedUpscaleOptions = GameImageUpscaleOptions & {
  scale: number
  model: string
}

function UpscaleOptionsEditor({
  backend,
  value,
  onValueChange
}: UpscaleOptionsEditorProps): React.JSX.Element {
  const { t } = useTranslation('utils')
  const generatedId = React.useId()

  const normalizedValue = normalizeUpscaleOptions(value, backend)
  const modelOptions = getUpscalerModelOptions(backend)
  const scaleOptions = getUpscalerScaleOptions(backend, normalizedValue.model)
  const denoiseLevelOptions = getUpscalerDenoiseLevelOptions(
    backend,
    normalizedValue.model,
    normalizedValue.scale
  )

  const handleValueChange = React.useCallback(
    (patch: Partial<ResolvedUpscaleOptions>) => {
      onValueChange(applyUpscalePatch(normalizedValue, backend, patch))
    },
    [backend, normalizedValue, onValueChange]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-[120px] flex-col gap-1.5">
        <Label htmlFor={`${generatedId}-scale`}>{t('upscale.scaleLabel')}</Label>
        <Select
          value={String(normalizedValue.scale)}
          onValueChange={(nextValue) => handleValueChange({ scale: Number(nextValue) })}
        >
          <SelectTrigger id={`${generatedId}-scale`} className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scaleOptions.map((scale) => (
              <SelectItem key={String(scale)} value={String(scale)}>
                {scale}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-[200px] flex-col gap-1.5">
        <Label htmlFor={`${generatedId}-model`}>{t('upscale.modelLabel')}</Label>
        <Select
          value={normalizedValue.model}
          onValueChange={(model) => handleValueChange({ model })}
        >
          <SelectTrigger id={`${generatedId}-model`} className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {denoiseLevelOptions.length > 0 && (
        <div className="flex min-w-[140px] flex-col gap-1.5">
          <Label htmlFor={`${generatedId}-denoise-level`}>{t('upscale.denoiseLevelLabel')}</Label>
          <Select
            value={String(normalizedValue.denoiseLevel)}
            onValueChange={(nextValue) => handleValueChange({ denoiseLevel: Number(nextValue) })}
          >
            <SelectTrigger id={`${generatedId}-denoise-level`} className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {denoiseLevelOptions.map((denoiseLevel) => (
                <SelectItem key={String(denoiseLevel)} value={String(denoiseLevel)}>
                  {formatDenoiseLevelLabel(denoiseLevel, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

function normalizeUpscaleOptions(
  value: GameImageUpscaleOptions,
  backend: UpscalerBackend
): ResolvedUpscaleOptions {
  const modelOptions = getUpscalerModelOptions(backend)
  const model = resolveOptionValue(value.model, modelOptions)

  const scaleOptions = getUpscalerScaleOptions(backend, model)
  const scale = resolveOptionValue(value.scale, scaleOptions)

  const denoiseLevelOptions = getUpscalerDenoiseLevelOptions(backend, model, scale)
  const denoiseLevel = resolveOptionValue(value.denoiseLevel, denoiseLevelOptions)

  return {
    scale,
    model,
    ...(denoiseLevelOptions.length > 0 && denoiseLevel !== undefined ? { denoiseLevel } : {})
  }
}

function applyUpscalePatch(
  currentValue: ResolvedUpscaleOptions,
  backend: UpscalerBackend,
  patch: Partial<ResolvedUpscaleOptions>
): GameImageUpscaleOptions {
  const model = patch.model ?? currentValue.model
  const scaleOptions = getUpscalerScaleOptions(backend, model)
  const scale = resolveOptionValue(patch.scale ?? currentValue.scale, scaleOptions)
  const denoiseLevelOptions = getUpscalerDenoiseLevelOptions(backend, model, scale)

  if (denoiseLevelOptions.length === 0) {
    return {
      scale,
      model
    }
  }

  const denoiseLevel = resolveOptionValue(
    patch.denoiseLevel ?? currentValue.denoiseLevel,
    denoiseLevelOptions
  )

  return {
    scale,
    model,
    ...(denoiseLevel !== undefined ? { denoiseLevel } : {})
  }
}

function resolveOptionValue<T extends string | number>(
  value: T | undefined,
  options: readonly T[]
): T {
  if (value !== undefined && options.includes(value)) {
    return value
  }

  return options[0] as T
}

function formatDenoiseLevelLabel(
  denoiseLevel: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (denoiseLevel === -1) {
    return t('upscale.noDenoise')
  }

  return t('upscale.denoiseLevel', { level: denoiseLevel })
}
