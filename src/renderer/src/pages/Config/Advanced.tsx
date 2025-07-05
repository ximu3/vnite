import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { HotkeySetting } from '@ui/hotkey-setting'
import { useConfigLocalState } from '~/hooks'
import { useTranslation } from 'react-i18next'

export function Advanced(): JSX.Element {
  const { t } = useTranslation('config')

  const [lePath, setLePath] = useConfigLocalState('game.linkage.localeEmulator.path')
  const [vbaPath, setVbaPath] = useConfigLocalState('game.linkage.visualBoyAdvance.path')
  const [magpiePath, setMagpiePath] = useConfigLocalState('game.linkage.magpie.path')
  const [magpieHotkey, setMagpieHotkey] = useConfigLocalState('game.linkage.magpie.hotkey')

  async function selectLePath(): Promise<void> {
    const lePath: string = await window.api.utils.selectPathDialog(['openFile'])
    setLePath(lePath)
  }

  async function selectVbaPath(): Promise<void> {
    const vbaPath: string = await window.api.utils.selectPathDialog(['openFile'])
    setVbaPath(vbaPath)
  }

  async function selectMagpiePath(): Promise<void> {
    const magpiePath: string = await window.api.utils.selectPathDialog(['openFile'])
    setMagpiePath(magpiePath)
  }

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
        <div className={cn('grid grid-cols-[170px_1fr] gap-x-5 gap-y-5 items-center')}>
          {/* Locale Emulator Path */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('advanced.localeEmulator.name')}
          </div>
          <div className={cn('flex flex-row gap-3')}>
            <Input
              value={lePath}
              onChange={(e) => setLePath(e.target.value)}
              placeholder={t('advanced.localeEmulator.placeholder')}
              className={cn('flex-1')}
            />
            <Button variant={'outline'} size={'icon'} onClick={selectLePath}>
              <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
            </Button>
          </div>

          {/* Visual Boy Advance Path */}
          <div className={cn('whitespace-nowrap select-none self-center')}>
            {t('advanced.visualBoyAdvance.name')}
          </div>
          <div className={cn('flex flex-row gap-3')}>
            <Input
              value={vbaPath}
              onChange={(e) => setVbaPath(e.target.value)}
              placeholder={t('advanced.visualBoyAdvance.placeholder')}
              className={cn('flex-1')}
            />
            <Button variant={'outline'} size={'icon'} onClick={selectVbaPath}>
              <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
            </Button>
          </div>

          {/* Magpie Path */}
          <div className={cn('whitespace-nowrap select-none self-start pt-2')}>
            {t('advanced.magpie.name')}
          </div>
          <div className={cn('grid grid-rows-2 gap-5')}>
            <div className={cn('flex flex-row gap-3')}>
              <Input
                value={magpiePath}
                onChange={(e) => setMagpiePath(e.target.value)}
                placeholder={t('advanced.magpie.placeholder')}
                className={cn('flex-1')}
              />
              <Button variant={'outline'} size={'icon'} onClick={selectMagpiePath}>
                <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
              </Button>
            </div>
            <div className={cn('flex flex-row justify-end items-center gap-5')}>
              <div className={cn('text-sm')}>{t('advanced.magpie.hotkeyLabel')}</div>
              <HotkeySetting defaultHotkey={magpieHotkey} onHotkeyChange={setMagpieHotkey} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
