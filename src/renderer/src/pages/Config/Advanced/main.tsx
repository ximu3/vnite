import { Button } from '@ui/button'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfigItem } from '~/components/form/ConfigItem'
import { UpscalerConfigDialog } from '~/components/utils/UpscalerConfigDialog'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/utils'
import { RandomFilter } from './randomFilter'

export function Advanced(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [isUpscalerDialogOpen, setIsUpscalerDialogOpen] = useState(false)

  return (
    <>
      <div className={cn('flex flex-col gap-8')}>
        <Card className={cn('group')}>
          <CardHeader>
            <CardTitle className={cn('relative')}>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div className={cn('flex items-center')}>{t('advanced.title')}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('space-y-4')}>
              {/* Locale Emulator Path */}
              <ConfigItem
                hookType="configLocal"
                path="game.linkage.localeEmulator.path"
                title={t('advanced.localeEmulator.name')}
                description={t('advanced.localeEmulator.description')}
                controlType="fileinput"
                placeholder={t('advanced.localeEmulator.placeholder')}
                dialogType="openFile"
              />

              {/* Visual Boy Advance Path */}
              <ConfigItem
                hookType="configLocal"
                path="game.linkage.visualBoyAdvance.path"
                title={t('advanced.visualBoyAdvance.name')}
                description={t('advanced.visualBoyAdvance.description')}
                controlType="fileinput"
                placeholder={t('advanced.visualBoyAdvance.placeholder')}
                dialogType="openFile"
              />

              {/* Upscaler Path */}
              <ConfigItem
                hookType="configLocal"
                path="game.linkage.upscaler.path"
                title={t('advanced.upscaler.name')}
                description={t('advanced.upscaler.description')}
                controlType="fileinput"
                placeholder={t('advanced.upscaler.placeholder')}
                dialogType="openFile"
                buttonSlot={
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsUpscalerDialogOpen(true)}
                    title={t('advanced.upscaler.configure')}
                  >
                    <span className={cn('icon-[mdi--cog] w-4 h-4')}></span>
                  </Button>
                }
              />

              {/* Magpie Path */}
              <ConfigItem
                hookType="configLocal"
                path="game.linkage.magpie.path"
                title={t('advanced.magpie.name')}
                description={t('advanced.magpie.description')}
                controlType="fileinput"
                placeholder={t('advanced.magpie.placeholder')}
                dialogType="openFile"
              />

              {/* Magpie Hotkey */}
              <ConfigItem
                hookType="configLocal"
                path="game.linkage.magpie.hotkey"
                title={t('advanced.magpie.hotkeyLabel')}
                description={t('advanced.magpie.hotkeyDescription')}
                controlType="hotkey"
              />
            </div>
          </CardContent>
        </Card>

        <RandomFilter />
      </div>

      <UpscalerConfigDialog open={isUpscalerDialogOpen} onOpenChange={setIsUpscalerDialogOpen} />
    </>
  )
}
