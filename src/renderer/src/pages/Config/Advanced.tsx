import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { useTranslation } from 'react-i18next'

export function Advanced(): React.JSX.Element {
  const { t } = useTranslation('config')

  return (
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
            buttonTooltip="选择 Locale Emulator 程序"
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
            buttonTooltip="选择 VBA 模拟器程序"
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
            buttonTooltip="选择 Magpie 程序"
          />

          {/* Magpie Hotkey */}
          <ConfigItem
            hookType="configLocal"
            path="game.linkage.magpie.hotkey"
            title={t('advanced.magpie.hotkeyLabel')}
            description={t('advanced.magpie.hotkeyDescription')}
            controlType="hotkey"
            inputClassName="font-mono"
          />
        </div>
      </CardContent>
    </Card>
  )
}
