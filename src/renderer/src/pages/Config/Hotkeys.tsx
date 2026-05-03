import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { ConfigItem } from '~/components/form/ConfigItem'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/utils'

type ScreenshotHotkeyName = 'captureRectangle' | 'captureActiveWindow' | 'captureFullscreen'

export function Hotkeys(): React.JSX.Element {
  const { t } = useTranslation(['config', 'utils'])

  const updateScreenshotHotkey = async (
    hotkeyName: ScreenshotHotkeyName,
    hotkey: string
  ): Promise<boolean> => {
    const result = await ipcManager.invoke('system:update-screenshot-hotkey', hotkeyName, hotkey)

    if (result.success) {
      return true
    }

    const errorMessage =
      result.reason === 'registrationFailed'
        ? t('utils:hotkeySetting.errors.registrationFailed')
        : t('utils:hotkeySetting.errors.unknown')
    toast.error(errorMessage)
    return false
  }

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
                path="hotkeys.captureRectangle"
                title={t('hotkeys.quickActions.captureRectangle')}
                beforeChange={(hotkey) => {
                  return updateScreenshotHotkey('captureRectangle', hotkey)
                }}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="configLocal"
                path="hotkeys.captureActiveWindow"
                title={t('hotkeys.quickActions.captureActiveWindow')}
                beforeChange={(hotkey) => {
                  return updateScreenshotHotkey('captureActiveWindow', hotkey)
                }}
                controlType="hotkey"
              />
              <ConfigItem
                hookType="configLocal"
                path="hotkeys.captureFullscreen"
                title={t('hotkeys.quickActions.captureFullscreen')}
                beforeChange={(hotkey) => {
                  return updateScreenshotHotkey('captureFullscreen', hotkey)
                }}
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
