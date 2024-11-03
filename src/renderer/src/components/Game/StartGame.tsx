import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Button } from '@ui/button'
import { ipcSend, ipcInvoke } from '~/utils'
import { toast } from 'sonner'

export function StartGame({
  gameId,
  runningGames,
  setRunningGames
}: {
  gameId: string
  runningGames: string[]
  setRunningGames: (value: string[]) => void
}): JSX.Element {
  const [mode] = useDBSyncedState('file', `games/${gameId}/launcher.json`, ['mode'])
  const [gamePath, setGamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [fileConfig] = useDBSyncedState(
    {
      path: '',
      workingDirectory: '',
      timerMode: 'folder',
      timerPath: ''
    },
    `games/${gameId}/launcher.json`,
    ['fileConfig']
  )
  const [scriptConfig] = useDBSyncedState(
    {
      command: [''],
      workingDirectory: '',
      timerMode: 'folder',
      timerPath: ''
    },
    `games/${gameId}/launcher.json`,
    ['scriptConfig']
  )
  const [urlConfig] = useDBSyncedState(
    {
      url: '',
      timerMode: 'folder',
      timerPath: '',
      browserPath: ''
    },
    `games/${gameId}/launcher.json`,
    ['urlConfig']
  )

  async function startGame(): Promise<void> {
    if (gamePath === '') {
      toast.warning('请先设置游戏路径')
      const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      setGamePath(filePath)
      ipcSend('launcher-preset', 'default', gameId)
      return
    }
    if (mode === 'file') {
      if (
        fileConfig.path &&
        fileConfig.workingDirectory &&
        fileConfig.timerPath &&
        fileConfig.timerMode
      ) {
        ipcSend('start-game', gameId)
        setRunningGames([...runningGames, gameId])
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else if (mode === 'script') {
      if (
        scriptConfig.command &&
        scriptConfig.workingDirectory &&
        scriptConfig.timerPath &&
        scriptConfig.timerMode
      ) {
        ipcSend('start-game', gameId)
        setRunningGames([...runningGames, gameId])
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else if (mode === 'url') {
      if (urlConfig.url) {
        ipcSend('start-game', gameId)
        setRunningGames([...runningGames, gameId])
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else {
      toast.error('运行配置错误，请检查！')
    }
  }

  return (
    <Button className={cn('')}>
      <div
        className={cn('flex flex-row gap-1 justify-center items-center p-3')}
        onClick={startGame}
      >
        <span className={cn('icon-[mdi--play] w-6 h-6 -ml-2')}></span>
        <div className={cn('')}>开始游戏</div>
      </div>
    </Button>
  )
}
