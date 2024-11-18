import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '~/components/Sidebar'
import { cn, ipcOnUnique, ipcSend } from '~/utils'
import { Library } from './Library'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRunningGames } from './Library/store'
import { useCloudSyncStore, SyncStatus } from '~/components/Config/CloudSync/store'

export function Main(): JSX.Element {
  const { runningGames, setRunningGames } = useRunningGames()
  const { setStatus } = useCloudSyncStore()
  useEffect(() => {
    const handleStartGameFromUrl = (
      _event: any,
      gameId: string,
      gamePath: string,
      mode: string,
      config: any
    ): void => {
      startGame(gameId, gamePath, mode, config)
    }

    const removeListener = ipcOnUnique('start-game-from-url', handleStartGameFromUrl)

    return (): void => {
      removeListener()
    }
  }, [runningGames, setRunningGames])

  useEffect(() => {
    const handleSyncStatus = (_event: any, status: SyncStatus): void => {
      setStatus(status)
    }

    const removeListener = ipcOnUnique('cloud-sync-status', handleSyncStatus)

    return (): void => {
      removeListener()
    }
  }, [setStatus])

  async function startGame(
    gameId: string,
    gamePath: string,
    mode: string,
    config: any
  ): Promise<void> {
    if (gamePath === '') {
      toast.warning('请先设置游戏路径')
      return
    }
    if (mode === 'file') {
      if (config.path && config.workingDirectory && config.timerPath && config.timerMode) {
        ipcSend('start-game', gameId)
        setRunningGames([...runningGames, gameId])
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else if (mode === 'script') {
      if (config.command && config.workingDirectory && config.timerPath && config.timerMode) {
        ipcSend('start-game', gameId)
        setRunningGames([...runningGames, gameId])
      } else {
        toast.error('运行配置错误，请检查！')
      }
    } else if (mode === 'url') {
      if (config.url) {
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
    <HashRouter>
      <div className={cn('flex flex-row w-screen h-screen')}>
        <Sidebar />
        <Routes>
          <Route index element={<Navigate to="/library" />} />
          <Route path="/library/*" element={<Library />} />
          <Route path="/record/*" element={<div></div>} />
        </Routes>
      </div>
    </HashRouter>
  )
}
