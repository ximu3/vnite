import { cn } from '~/utils'
import { Card, CardContent } from '@ui/card'
import { Switch } from '@ui/switch'
import { useConfigState } from '~/hooks'
import { useNavigate } from 'react-router-dom'
import { Button } from '@ui/button'
import { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import { Slider } from '@ui/slider'
import { useTranslation } from 'react-i18next'

export function Metadata(): JSX.Element {

  //Global values
  const { t } = useTranslation('config')
  const [transformerEnabled, setTransformerEnabled] = useConfigState('metadata.transformer.enabled')
  const [imageTransformerEnabled, setImageTransformerEnabled] = useConfigState('metadata.imageTransformer.enabled')
  const [imageTransformerValue, setImageTransformerQuality] = useConfigState('metadata.imageTransformer.quality')

  //Local values
  const [localImageTransformerValue, setLocalImageTransformerValue] = useState(imageTransformerValue ?? 80)

  const debouncedSetImageTransformerQuality = useCallback(
    debounce((value: number) => {
      setImageTransformerQuality(value)
    }, 300),
    [setImageTransformerQuality]
  )

  //Keep local state in sync with config
  useEffect(() => {
    setLocalImageTransformerValue(imageTransformerValue ?? 80)
  }, [imageTransformerValue])

  const navigate = useNavigate()

  return (
    <Card className={cn('group')}>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* Transformer section */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('metadata.transformer.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('metadata.transformer.enable')}
                </div>
                <div className={cn('justify-self-end')}>
                  <Switch
                    checked={transformerEnabled}
                    onCheckedChange={(checked) => setTransformerEnabled(checked)}
                  />
                </div>

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('metadata.transformer.manage')}
                </div>
                <div className={cn('justify-self-end select-none')}>
                  <Button
                    variant={'outline'}
                    onClick={() => {
                      navigate('/transformer')
                    }}
                  >
                    {t('metadata.transformer.manageButton')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Image transformer section */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('metadata.imageTransformer.title')}</div>
            {/* Button to toggle on/off the image compression */}
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('metadata.imageTransformer.enable')}
                </div>
                <div className={cn('justify-self-end')}>
                  <Switch
                    checked={imageTransformerEnabled}
                    onCheckedChange={(checked) => setImageTransformerEnabled(checked)}
                  />
                </div>
              </div>
            </div>
            {/* Slider for image quality compression, only enabled if switch is ON */}
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                    {t('metadata.imageTransformer.quality')}
                </div>
                <div className={cn(
                    'flex items-center gap-2 w-[250px]', !imageTransformerEnabled && 'opacity-50 pointer-events-none select-none'
                  )}>
                  {/* Actual slider */}
                  <Slider
                    value={[localImageTransformerValue]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value: number[]) => {
                      const newValue = value[0]
                      setLocalImageTransformerValue(newValue)
                      debouncedSetImageTransformerQuality(newValue)
                    }}
                    className={cn('flex-1')}
                    disabled={!imageTransformerEnabled}
                  />
                  {/* Label for the slider */}
                  <span
                    className={cn(
                      'text-sm text-muted-foreground w-12 text-right select-none',
                      !imageTransformerEnabled && 'text-gray-400'
                    )}
                  >
                    {localImageTransformerValue}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
