import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
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
  const [url, setUrl] = useGameLocalState(gameId, 'launcher.urlConfig.url')
  const [browserPath, setBrowserPath] = useGameLocalState(gameId, 'launcher.urlConfig.browserPath')
  const [monitorMode, setMonitorMode] = useGameLocalState(gameId, 'launcher.urlConfig.monitorMode')
  const [monitorPath, setMonitorPath] = useGameLocalState(gameId, 'launcher.urlConfig.monitorPath')

  async function selectBorwserPath(): Promise<void> {
    const workingDirectoryPath: string = await ipcInvoke(
      'select-path-dialog',
      ['openFile'],
      ['exe']
    )
    setBrowserPath(workingDirectoryPath)
  }
  async function selectMonitorPath(): Promise<void> {
    if (monitorMode === 'file') {
      const monitorPath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      setMonitorPath(monitorPath)
    }
    if (monitorMode === 'folder') {
      const monitorPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
      setMonitorPath(monitorPath)
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
          <Select value={monitorMode} onValueChange={setMonitorMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>追踪模式</SelectLabel>
                <SelectItem value="folder">目录</SelectItem>
                <SelectItem value="file">文件</SelectItem>
                <SelectItem value="process">进程</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        {['folder', 'file'].includes(monitorMode) ? <div>追踪路径</div> : <div>进程名称</div>}
        <div className={cn('w-3/4')}>
          <Input value={monitorPath} onChange={(e) => setMonitorPath(e.target.value)} />
        </div>
        {['folder', 'file'].includes(monitorMode) && (
          <Button
            variant={'outline'}
            size={'icon'}
            className={cn('-ml-3')}
            onClick={selectMonitorPath}
          >
            <span
              className={cn(
                monitorMode === 'folder'
                  ? 'icon-[mdi--folder-open-outline] w-5 h-5'
                  : 'icon-[mdi--file-outline] w-5 h-5'
              )}
            ></span>
          </Button>
        )}
      </div>
    </div>
  )
}
