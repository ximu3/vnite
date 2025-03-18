import { ipcOnUnique } from '~/utils'
import { useCloudSyncStore, SyncStatus } from '~/components/Config/CloudSync/store'
import { startGame } from '~/utils'
import { toast } from 'sonner'
import { useRunningGames } from '~/pages/Library/store'
import { setupDBSync } from '~/stores/sync'
import { useUpdaterStore } from '~/pages/Updater/store'

/**
 * Setting the game URL startup listener
 * @param navigate Route Navigation Functions
 */
export function setupGameUrlListener(navigate: (path: string) => void): () => void {
  const handleStartGameFromUrl = (_event: any, gameId: string): void => {
    startGame(gameId, navigate)
  }

  return ipcOnUnique('start-game-from-url', handleStartGameFromUrl)
}

/**
 * Setting up a Cloud Synchronization Status Listener
 */
export function setupCloudSyncListener(): () => void {
  const { setStatus } = useCloudSyncStore.getState()

  const handleSyncStatus = (_event: any, status: SyncStatus): void => {
    setStatus(status)
  }

  return ipcOnUnique('cloud-sync-status', handleSyncStatus)
}

export function setupGameExitListeners(): () => void {
  const { setRunningGames } = useRunningGames.getState()

  // Game is exiting listener
  const exitingListener = ipcOnUnique('game-exiting', (_, gameId: string) => {
    toast.loading('正在退出游戏...', { id: `${gameId}-exiting` })
  })

  // Game is exited listener
  const exitedListener = ipcOnUnique('game-exited', (_, gameId: string) => {
    const { runningGames } = useRunningGames.getState()
    const newRunningGames = runningGames.filter((id) => id !== gameId)

    // Update the list of running games
    setRunningGames(newRunningGames)

    toast.success('游戏已退出', {
      id: `${gameId}-exiting`
    })

    // Turn off notifications after 4 seconds
    setTimeout(() => {
      toast.dismiss(`${gameId}-exiting`)
    }, 4000)
  })

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
 * Setting up all application listeners
 * @param navigate Route Navigation Functions
 * @returns Cleaning up the function array
 */
export async function setup(navigate: (path: string) => void): Promise<() => void> {
  const cleanupFunctions = [
    setupGameUrlListener(navigate),
    setupCloudSyncListener(),
    setupGameExitListeners(),
    await setupDBSync(),
    setupUpdateListener()
  ]

  return () => {
    cleanupFunctions.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })
  }
}
