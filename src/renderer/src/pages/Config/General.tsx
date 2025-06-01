import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Switch } from '@ui/switch'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { useTheme } from '../../components/ThemeProvider'

export function General(): JSX.Element {
  const [openAtLogin, setOpenAtLogin] = useConfigState('general.openAtLogin')
  const [quitToTray, setQuitToTray] = useConfigState('general.quitToTray')
  const { themeSetting, setThemeSetting } = useTheme()
  const { t } = useTranslation('config')
  const { i18n } = useTranslation()
  const [language, setLanguage] = useConfigState('general.language')
  const [hideWindowAfterGameStart, setHideWindowAfterGameStart] = useConfigState(
    'general.hideWindowAfterGameStart'
  )

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '正體中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ru', label: 'Русский' },
    { value: 'ko', label: '한국어' }
  ]

  // Handling of language changes
  const handleLanguageChange = async (value: string): Promise<void> => {
    await setLanguage(value)
    await i18n.changeLanguage(value)
    await window.api.utils.updateLanguage(value)
  }

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
        <div className={cn('grid grid-cols-[120px_1fr] gap-x-3 gap-y-5 items-center')}>
          {/* open at login */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('general.openAtLogin')}
          </div>
          <div className={cn('flex justify-end')}>
            <Switch
              checked={openAtLogin}
              onCheckedChange={async (checked) => {
                try {
                  await setOpenAtLogin(checked)
                  await window.api.utils.updateOpenAtLogin()
                  await window.api.utils.updateTrayConfig()
                } catch (error) {
                  console.error('Failed to update settings:', error)
                }
              }}
            />
          </div>

          {/* language */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('general.language')}
          </div>
          <div className={cn('flex justify-end')}>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className={cn('w-[200px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('general.language')}</SelectLabel>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* theme */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('general.theme')}
          </div>
          <div className={cn('flex justify-end')}>
            <Select
              value={themeSetting}
              onValueChange={(value: 'dark' | 'light' | 'follow-system') => setThemeSetting(value)}
            >
              <SelectTrigger className={cn('w-[200px]')}>
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
          </div>

          {/* Closing behavior */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('general.closeMainPanel')}
          </div>
          <div className={cn('flex justify-end')}>
            <Select
              value={quitToTray.toString()}
              onValueChange={async (value) => {
                await setQuitToTray(value === 'true')
                await window.api.utils.updateTrayConfig()
              }}
            >
              <SelectTrigger className={cn('w-[200px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('general.action')}</SelectLabel>
                  <SelectItem value="false">{t('general.quitApp')}</SelectItem>
                  <SelectItem value="true">{t('general.minimizeToTray')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Run game behavior */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('general.hideWindowAfterGameStart')}
          </div>
          <div className={cn('flex justify-end')}>
            <Switch
              checked={hideWindowAfterGameStart}
              onCheckedChange={(checked) => setHideWindowAfterGameStart(checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
