import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { HotkeySetting } from '@ui/hotkey-setting'

export function Hotkeys(): JSX.Element {
  const { t } = useTranslation('config')

  // Page navigation hotkeys
  const [libraryHotkey, setLibraryHotkey] = useConfigState('hotkeys.library')
  const [recordHotkey, setRecordHotkey] = useConfigState('hotkeys.record')
  const [scannerHotkey, setScannerHotkey] = useConfigState('hotkeys.scanner')
  const [configHotkey, setConfigHotkey] = useConfigState('hotkeys.config')

  // Quick action hotkeys
  const [addGameHotkey, setAddGameHotkey] = useConfigState('hotkeys.addGame')

  // Other hotkeys
  const [randomGameHotkey, setRandomGameHotkey] = useConfigState('hotkeys.randomGame')

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
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('hotkeys.pageNavigation.library')}
                </div>
                <div className={cn('justify-self-end')}>
                  <HotkeySetting
                    defaultHotkey={libraryHotkey}
                    onHotkeyChange={(newHotkey) => setLibraryHotkey(newHotkey)}
                  />
                </div>

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('hotkeys.pageNavigation.record')}
                </div>
                <div className={cn('justify-self-end')}>
                  <HotkeySetting
                    defaultHotkey={recordHotkey}
                    onHotkeyChange={(newHotkey) => setRecordHotkey(newHotkey)}
                  />
                </div>

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('hotkeys.pageNavigation.scanner')}
                </div>
                <div className={cn('justify-self-end')}>
                  <HotkeySetting
                    defaultHotkey={scannerHotkey}
                    onHotkeyChange={(newHotkey) => setScannerHotkey(newHotkey)}
                  />
                </div>

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('hotkeys.pageNavigation.config')}
                </div>
                <div className={cn('justify-self-end')}>
                  <HotkeySetting
                    defaultHotkey={configHotkey}
                    onHotkeyChange={(newHotkey) => setConfigHotkey(newHotkey)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick action hotkeys */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('hotkeys.quickActions.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('hotkeys.quickActions.addGame')}
                </div>
                <div className={cn('justify-self-end')}>
                  <HotkeySetting
                    defaultHotkey={addGameHotkey}
                    onHotkeyChange={(newHotkey) => setAddGameHotkey(newHotkey)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Other hotkeys */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('hotkeys.others.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('hotkeys.others.randomGame')}
                </div>
                <div className={cn('justify-self-end')}>
                  <HotkeySetting
                    defaultHotkey={randomGameHotkey}
                    onHotkeyChange={(newHotkey) => setRandomGameHotkey(newHotkey)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
