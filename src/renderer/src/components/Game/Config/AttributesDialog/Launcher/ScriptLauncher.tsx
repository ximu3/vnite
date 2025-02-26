import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { ArrayTextarea } from '~/components/ui/array-textarea'
import { ipcInvoke } from '~/utils'

export function ScriptLauncher({ gameId }: { gameId: string }): JSX.Element {
  const [command, setCommand] = useGameLocalState(gameId, 'launcher.scriptConfig.command')
  const [workingDirectory, setWorkingDirectory] = useGameLocalState(
    gameId,
    'launcher.scriptConfig.workingDirectory'
  )

  async function selectWorkingDirectory(): Promise<void> {
    const workingDirectoryPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
    setWorkingDirectory(workingDirectoryPath)
  }

  return (
    <div className={cn('flex flex-col gap-5 w-full')}>
      <div className={cn('flex flex-row gap-5 items-start justify-start')}>
        <div>脚本内容</div>
        <div className={cn('w-3/4')}>
          <ArrayTextarea
            value={command}
            onChange={setCommand}
            className={cn('max-h-[250px] min-h-[100px]')}
          />
        </div>
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
