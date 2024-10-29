import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { ipcInvoke } from '~/utils'

export function UrlLauncher({ gameId }: { gameId: string }): JSX.Element {
  const [url, setUrl] = useDBSyncedState('', `games/${gameId}/launcher.json`, ['urlConfig', 'url'])
  const [browserPath, setBrowserPath] = useDBSyncedState('', `games/${gameId}/launcher.json`, [
    'urlConfig',
    'browserPath'
  ])
  const [timerMode, setTimerMode] = useDBSyncedState('folder', `games/${gameId}/launcher.json`, [
    'urlConfig',
    'timerMode'
  ])
  const [timerPath, setTimerPath] = useDBSyncedState('', `games/${gameId}/launcher.json`, [
    'urlConfig',
    'timerPath'
  ])
  async function selectBorwserPath(): Promise<void> {
    const workingDirectoryPath: string = await ipcInvoke(
      'select-path-dialog',
      ['openFile'],
      ['exe']
    )
    setBrowserPath(workingDirectoryPath)
  }
  async function selectTimerPath(): Promise<void> {
    if (timerMode === 'folder') {
      const timerPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
      setTimerPath(timerPath)
    }
    if (timerMode === 'file') {
      const timerPath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      setTimerPath(timerPath)
    }
  }
  return (
    <div className={cn('flex flex-col gap-5 w-full')}>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>链接地址</div>
        <div className={cn('w-3/4')}>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>浏览器</div>
        <div className={cn('w-3/4 ml-4')}>
          <Input
            value={browserPath}
            onChange={(e) => setBrowserPath(e.target.value)}
            placeholder="系统默认浏览器"
          />
        </div>
        <Button
          variant={'outline'}
          size={'icon'}
          className={cn('-ml-3')}
          onClick={selectBorwserPath}
        >
          <span className={cn('icon-[mdi--folder-open-outline] w-5 h-5')}></span>
        </Button>
      </div>
      <Separator />
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>追踪模式</div>
        <div className={cn('w-[120px]')}>
          <Select value={timerMode} onValueChange={setTimerMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>追踪模式</SelectLabel>
                <SelectItem value="folder">目录</SelectItem>
                <SelectItem value="file">文件</SelectItem>
                <SelectItem value="browser">浏览器</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {timerMode !== 'browser' && (
        <div className={cn('flex flex-row gap-5 items-center justify-start')}>
          <div>追踪路径</div>
          <div className={cn('w-3/4')}>
            <Input value={timerPath} onChange={(e) => setTimerPath(e.target.value)} />
          </div>
          <Button
            variant={'outline'}
            size={'icon'}
            className={cn('-ml-3')}
            onClick={selectTimerPath}
          >
            <span
              className={cn(
                timerMode === 'folder'
                  ? 'icon-[mdi--folder-open-outline] w-5 h-5'
                  : 'icon-[mdi--file-outline] w-5 h-5'
              )}
            ></span>
          </Button>
        </div>
      )}
    </div>
  )
}
