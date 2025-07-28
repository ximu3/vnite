import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'

export function Hotkeys(): React.JSX.Element {
  const { t } = useTranslation('config')

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('hotkeys.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* Page navigation hotkeys */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('hotkeys.pageNavigation.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="hotkeys.library"
                title={t('hotkeys.pageNavigation.library')}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="config"
                path="hotkeys.record"
                title={t('hotkeys.pageNavigation.record')}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="config"
                path="hotkeys.scanner"
                title={t('hotkeys.pageNavigation.scanner')}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="config"
                path="hotkeys.config"
                title={t('hotkeys.pageNavigation.config')}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="config"
                path="hotkeys.goBack"
                title={t('hotkeys.pageNavigation.goBack')}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="config"
                path="hotkeys.goForward"
                title={t('hotkeys.pageNavigation.goForward')}
                controlType="hotkey"
              />
            </div>
          </div>

          {/* Quick action hotkeys */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('hotkeys.quickActions.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="hotkeys.addGame"
                title={t('hotkeys.quickActions.addGame')}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="configLocal"
                path="hotkeys.capture"
                title={t('hotkeys.quickActions.capture')}
                controlType="hotkey"
              />
            </div>
          </div>

          {/* Other hotkeys */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('hotkeys.others.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="hotkeys.randomGame"
                title={t('hotkeys.others.randomGame')}
                controlType="hotkey"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
