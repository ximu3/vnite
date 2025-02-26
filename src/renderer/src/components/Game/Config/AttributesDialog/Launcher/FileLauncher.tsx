import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'

export function FileLauncher({ gameId }: { gameId: string }): JSX.Element {
  const [path, setPath] = useGameLocalState(gameId, 'launcher.fileConfig.path')
  const [workingDirectory, setWorkingDirectory] = useGameLocalState(
    gameId,
    'launcher.fileConfig.workingDirectory'
  )

  async function selectFilePath(): Promise<void> {
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setPath(filePath)
  }
  async function selectWorkingDirectory(): Promise<void> {
    const workingDirectoryPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
    setWorkingDirectory(workingDirectoryPath)
  }

  return (
    <div className={cn('flex flex-col gap-5 w-full')}>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>文件路径</div>
        <div className={cn('w-3/4')}>
          <Input value={path} onChange={(e) => setPath(e.target.value)} />
        </div>
        <Button variant={'outline'} size={'icon'} className={cn('-ml-3')} onClick={selectFilePath}>
          <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
        </Button>
      </div>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>工作目录</div>
        <div className={cn('w-3/4')}>
          <Input value={workingDirectory} onChange={(e) => setWorkingDirectory(e.target.value)} />
        </div>
        <Button
          variant={'outline'}
          size={'icon'}
          className={cn('-ml-3')}
          onClick={selectWorkingDirectory}
        >
          <span className={cn('icon-[mdi--folder-open-outline] w-5 h-5')}></span>
        </Button>
      </div>
    </div>
  )
}
