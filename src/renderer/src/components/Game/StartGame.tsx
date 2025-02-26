import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Button } from '@ui/button'
import { ipcSend, ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useRunningGames } from '~/pages/Library/store'

export function StartGame({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [mode] = useDBSyncedState('file', `games/${gameId}/launcher.json`, ['mode'])
  const [gamePath, setGamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [playStatus, setPlayStatus] = useDBSyncedState('unplayed', `games/${gameId}/record.json`, [
    'playStatus'
  ])
  const { runningGames, setRunningGames } = useRunningGames()

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
      if (!filePath) {
        return
      }
      await setGamePath(filePath)
      // const isIconAccessible = await canAccessImageFile(gameId, 'icon')
      const isIconAccessible = await ipcInvoke('check-game-icon', gameId)
      if (!isIconAccessible) {
        await ipcInvoke('save-game-icon', gameId, filePath)
      }
      toast.promise(
        async () => {
          await ipcInvoke('launcher-preset', 'default', gameId)
        },
        {
          loading: '正在配置启动器...',
          success: '启动器配置成功',
          error: (error) => `${error}`
        }
      )
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
        if (playStatus === 'unplayed') {
          setPlayStatus('playing')
        }
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
        if (playStatus === 'unplayed') {
          setPlayStatus('playing')
        }
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else if (mode === 'url') {
      if (urlConfig.url) {
        ipcSend('start-game', gameId)
        setRunningGames([...runningGames, gameId])
        if (playStatus === 'unplayed') {
          setPlayStatus('playing')
        }
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else {
      toast.error('运行配置错误，请检查！')
    }
  }
  return (
    <Button className={cn('', className)} onClick={startGame}>
      <div className={cn('flex flex-row justify-center gap-1 items-center w-full h-full p-3')}>
        <span className={cn('icon-[mdi--play] w-6 h-6 -ml-1')}></span>
        <div className={cn('')}>开始游戏</div>
      </div>
    </Button>
  )
}
