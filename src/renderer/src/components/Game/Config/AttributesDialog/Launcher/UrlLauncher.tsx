import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'

export function UrlLauncher({ gameId }: { gameId: string }): JSX.Element {
  const [url, setUrl] = useGameLocalState(gameId, 'launcher.urlConfig.url')
  const [browserPath, setBrowserPath] = useGameLocalState(gameId, 'launcher.urlConfig.browserPath')
  async function selectBorwserPath(): Promise<void> {
    const workingDirectoryPath: string = await ipcInvoke(
      'select-path-dialog',
      ['openFile'],
      ['exe']
    )
    setBrowserPath(workingDirectoryPath)
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
    </div>
  )
}
