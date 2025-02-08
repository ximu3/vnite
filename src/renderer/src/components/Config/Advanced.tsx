import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { HotkeySetting } from '@ui/hotkey-setting'
import { useDBSyncedState } from '~/hooks'
import { ipcInvoke } from '~/utils'

export function Advanced(): JSX.Element {
  const [lePath, setLePath] = useDBSyncedState('', 'config.json', [
    'advanced',
    'linkage',
    'localeEmulator',
    'path'
  ])
  const [vbaPath, setVbaPath] = useDBSyncedState('', 'config.json', [
    'advanced',
    'linkage',
    'visualBoyAdvance',
    'path'
  ])
  const [magpiePath, setMagpiePath] = useDBSyncedState('', 'config.json', [
    'advanced',
    'linkage',
    'magpie',
    'path'
  ])
  const [magpieHotkey, setMagpieHotkey] = useDBSyncedState('win+shift+a', 'config.json', [
    'advanced',
    'linkage',
    'magpie',
    'hotkey'
  ])
  async function selectLePath(): Promise<void> {
    const lePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setLePath(lePath)
  }
  async function selectVbaPath(): Promise<void> {
    const vbaPath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setVbaPath(vbaPath)
  }
  async function selectMagpiePath(): Promise<void> {
    const magpiePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setMagpiePath(magpiePath)
  }
  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>联动</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 justify-center')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>Locale Emulator</div>
            <div className={cn('w-7/12 flex flex-row gap-3')}>
              <Input
                value={lePath}
                onChange={(e) => setLePath(e.target.value)}
                placeholder="请输入LEProc.exe的路径"
                className={cn('flex-1')}
              />
              <Button variant={'outline'} size={'icon'} className={cn('')} onClick={selectLePath}>
                <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
              </Button>
            </div>
          </div>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>VisualBoyAdvance</div>
            <div className={cn('w-7/12 flex flex-row gap-3')}>
              <Input
                value={vbaPath}
                onChange={(e) => setVbaPath(e.target.value)}
                placeholder="请输入visualboyadvance.exe的路径"
                className={cn('flex-1')}
              />
              <Button variant={'outline'} size={'icon'} className={cn('')} onClick={selectVbaPath}>
                <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
              </Button>
            </div>
          </div>
          <div className={cn('flex flex-row justify-between items-start')}>
            <div>Magpie</div>
            <div className={cn('w-7/12 flex flex-col gap-5 items-end')}>
              <div className={cn('flex flex-row gap-3 w-full')}>
                <Input
                  value={magpiePath}
                  onChange={(e) => setMagpiePath(e.target.value)}
                  placeholder="请输入Magpie.exe的路径"
                  className={cn('flex-1')}
                />
                <Button
                  variant={'outline'}
                  size={'icon'}
                  className={cn('')}
                  onClick={selectMagpiePath}
                >
                  <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
                </Button>
              </div>
              <div className={cn('flex flex-row justify-end items-center w-full gap-5')}>
                <div className={cn('text-sm')}>Magpie 缩放快捷键</div>
                <HotkeySetting defaultHotkey={magpieHotkey} onHotkeyChange={setMagpieHotkey} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
