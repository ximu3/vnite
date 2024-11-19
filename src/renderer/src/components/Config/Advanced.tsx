import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { useDBSyncedState } from '~/hooks'
import { ipcInvoke } from '~/utils'

export function Advanced(): JSX.Element {
  const [lePath, setLePath] = useDBSyncedState('', 'config.json', [
    'advanced',
    'linkage',
    'localeEmulator',
    'path'
  ])
  async function selectLePath(): Promise<void> {
    const lePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setLePath(lePath)
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
            <div className={cn('w-1/2 -mr-[250px]')}>
              <Input
                value={lePath}
                onChange={(e) => setLePath(e.target.value)}
                placeholder="请输入LEProc.exe的路径"
              />
            </div>
            <Button
              variant={'outline'}
              size={'icon'}
              className={cn('-ml-3')}
              onClick={selectLePath}
            >
              <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
