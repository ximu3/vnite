import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { ConfigItemPure } from '~/components/form/ConfigItemPure'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { useTheme } from '../../components/ThemeProvider'
import { ipcManager } from '~/app/ipc'
import { eventBus } from '~/app/events'

export function General(): React.JSX.Element {
  const { themeSetting, setThemeSetting } = useTheme()
  const { t } = useTranslation('config')
  const { i18n } = useTranslation()

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '正體中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ru', label: 'Русский' },
    { value: 'ko', label: '한국어' }
  ]

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('general.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('space-y-4')}>
          {/* Open at login - 使用 ConfigItem 并通过 onChange 处理额外逻辑 */}
          <ConfigItem
            hookType="config"
            path="general.openAtLogin"
            title={t('general.openAtLogin')}
            description="系统启动时自动运行应用程序"
            controlType="switch"
            onChange={async (_checked: boolean) => {
              try {
                await ipcManager.invoke('utils:update-open-at-login')
                eventBus.emit('tray:config-updated', undefined, {
                  source: 'openAtLogin'
                })
              } catch (error) {
                console.error('Failed to update settings:', error)
              }
            }}
          />

          {/* Language - 使用 ConfigItem 并通过 onChange 处理语言切换 */}
          <ConfigItem
            hookType="config"
            path="general.language"
            title={t('general.language')}
            description="选择应用程序界面显示语言"
            controlType="select"
            options={languageOptions}
            onChange={async (value: string) => {
              await i18n.changeLanguage(value)
              await ipcManager.invoke('app:update-language', value)
            }}
          />

          {/* Theme - 使用 ConfigItemPure，因为它不在 config 存储中 */}
          <ConfigItemPure title={t('general.theme')} description="选择应用程序主题外观">
            <Select
              value={themeSetting}
              onValueChange={(value: 'dark' | 'light' | 'follow-system') => setThemeSetting(value)}
            >
              <SelectTrigger className={cn('')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('general.theme')}</SelectLabel>
                  <SelectItem value="dark">{t('general.darkTheme')}</SelectItem>
                  <SelectItem value="light">{t('general.lightTheme')}</SelectItem>
                  <SelectItem value="follow-system">{t('general.followSystem')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </ConfigItemPure>

          {/* Close behavior - 使用 select 让用户更好理解选项 */}
          <ConfigItem
            hookType="config"
            path="general.quitToTray"
            title={t('general.closeMainPanel')}
            description="选择关闭主窗口时的行为方式"
            controlType="select"
            options={[
              { value: 'false', label: t('general.quitApp') },
              { value: 'true', label: t('general.minimizeToTray') }
            ]}
            onChange={async (value: string) => {
              eventBus.emit('tray:config-updated', undefined, {
                source: 'quitToTray'
              })
              console.log('Close behavior changed:', value === 'true' ? 'minimize' : 'quit')
            }}
          />

          {/* Hide window after game start - 简单配置，使用 ConfigItem */}
          <ConfigItem
            hookType="config"
            path="general.hideWindowAfterGameStart"
            title={t('general.hideWindowAfterGameStart')}
            description="启动游戏后自动隐藏主窗口"
            controlType="switch"
          />
        </div>
      </CardContent>
    </Card>
  )
}
