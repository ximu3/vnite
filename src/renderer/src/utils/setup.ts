import { ipcOnUnique } from '~/utils'
import { useCloudSyncStore, SyncStatus } from '~/components/Config/CloudSync/store'
import { startGame } from '~/utils'
import { toast } from 'sonner'
import { useRunningGames } from '~/pages/Library/store'
import { setupDBSync } from '~/stores/sync'
import { useUpdaterStore } from '~/pages/Updater/store'

/**
 * 设置游戏URL启动监听器
 * @param navigate 路由导航函数
 */
export function setupGameUrlListener(navigate: (path: string) => void): () => void {
  const handleStartGameFromUrl = (_event: any, gameId: string): void => {
    startGame(gameId, navigate)
  }

  return ipcOnUnique('start-game-from-url', handleStartGameFromUrl)
}

/**
 * 设置云同步状态监听器
 */
export function setupCloudSyncListener(): () => void {
  const { setStatus } = useCloudSyncStore.getState()

  const handleSyncStatus = (_event: any, status: SyncStatus): void => {
    setStatus(status)
  }

  return ipcOnUnique('cloud-sync-status', handleSyncStatus)
}

export function setupGameExitListeners(): () => void {
  // 使用 getState() 直接访问状态，避免依赖问题
  const { setRunningGames } = useRunningGames.getState()

  // 游戏正在退出的监听器
  const exitingListener = ipcOnUnique('game-exiting', (_, gameId: string) => {
    toast.loading('正在退出游戏...', { id: `${gameId}-exiting` })
  })

  // 游戏已退出的监听器
  const exitedListener = ipcOnUnique('game-exited', (_, gameId: string) => {
    // 获取最新状态，避免闭包陈旧值问题
    const { runningGames } = useRunningGames.getState()
    const newRunningGames = runningGames.filter((id) => id !== gameId)

    // 更新运行中游戏列表
    setRunningGames(newRunningGames)

    // 显示通知
    toast.success('游戏已退出', {
      id: `${gameId}-exiting`
    })

    // 4秒后关闭通知
    setTimeout(() => {
      toast.dismiss(`${gameId}-exiting`)
    }, 4000)
  })

  // 返回清理函数，用于移除监听器
  return () => {
    exitingListener()
    exitedListener()
  }
}

export function setupUpdateListener(): () => void {
  const setIsUpdateDialogOpen = useUpdaterStore.getState().setIsOpen
  console.warn('[DEBUG] app.tsx')

  const removeUpdateAvailableListener = ipcOnUnique('update-available', (_event, _updateInfo) => {
    setIsUpdateDialogOpen(true)
  })
  return (): void => {
    removeUpdateAvailableListener()
  }
}

/**
 * 设置所有应用程序监听器
 * @param navigate 路由导航函数
 * @returns 清理函数数组
 */
export function setup(navigate: (path: string) => void): () => void {
  // 设置各种监听器
  const cleanupFunctions = [
    setupGameUrlListener(navigate),
    setupCloudSyncListener(),
    setupGameExitListeners(),
    setupDBSync(),
    setupUpdateListener()
  ]

  // 返回一个函数用于清理所有监听器
  return () => {
    cleanupFunctions.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })
  }
}
