import { ipcManager } from '~/app/ipc'
import { useCloudSyncStore, SyncStatus } from '~/pages/Config/CloudSync/store'
import { startGame } from '~/utils'
import { toast } from 'sonner'
import { useRunningGames } from '~/pages/Library/store'
import { setupDBSync } from '~/stores/sync'
import { useUpdaterStore } from '~/pages/Updater/store'
import { useLibrarybarStore } from '~/components/Librarybar/store'
import i18next from 'i18next'
import { useRouter } from '@tanstack/react-router'

/**
 * Setting the game URL startup listener
 * @param router Router instance from @tanstack/react-router
 */
export function setupGameUrlListener(router: ReturnType<typeof useRouter>): () => void {
  const handleStartGameFromUrl = (_event: any, gameId: string): void => {
    startGame(gameId, router.navigate)
  }

  return ipcManager.on('game:start-from-url', handleStartGameFromUrl)
}

/**
 * Setting up a Cloud Synchronization Status Listener
 */
export function setupCloudSyncListener(): () => void {
  const { setStatus } = useCloudSyncStore.getState()

  const handleSyncStatus = (_event: any, status: SyncStatus): void => {
    setStatus(status)
  }

  return ipcManager.on('db:sync-status', handleSyncStatus)
}

export function setupGameExitListeners(): () => void {
  const { setRunningGames } = useRunningGames.getState()
  const { refreshGameList } = useLibrarybarStore.getState()

  // Game is exiting listener
  const exitingListener = ipcManager.on('game:exiting', (_, gameId: string) => {
    toast.loading(i18next.t('utils:notifications.gameExiting'), { id: `${gameId}-exiting` })
  })

  // Game is exited listener
  const exitedListener = ipcManager.on('game:exited', (_, gameId: string) => {
    const { runningGames } = useRunningGames.getState()
    const newRunningGames = runningGames.filter((id) => id !== gameId)

    // Update the list of running games
    setRunningGames(newRunningGames)

    // Refresh the game list
    refreshGameList()

    toast.success(i18next.t('utils:notifications.gameExited'), {
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

export function setupFullSyncListener(): () => void {
  const syningListener = ipcManager.on('db:full-syncing', () => {
    toast.loading(i18next.t('utils:notifications.fullSyncing'), { id: 'full-syncing' })
  })
  const syncedListener = ipcManager.on('db:full-synced', () => {
    toast.success(i18next.t('utils:notifications.fullSynced'), {
      id: 'full-syncing'
    })
    // Turn off notifications after 4 seconds
    setTimeout(() => {
      toast.dismiss('full-syncing')
    }, 4000)
  })
  const syncErrorListener = ipcManager.on('db:full-sync-error', (_event, error: string) => {
    toast.error(i18next.t('utils:notifications.fullSyncError'), {
      id: 'full-syncing'
    })
    // Turn off notifications after 4 seconds
    setTimeout(() => {
      toast.dismiss('full-syncing')
    }, 4000)
    console.error('Full sync error:', error)
  })
  return () => {
    syningListener()
    syncedListener()
    syncErrorListener()
  }
}

export function setupUserInfoListener(): () => void {
  const userInfoListener = ipcManager.on('account:update-user-info-error', (_event) => {
    toast.error(i18next.t('utils:notifications.updateUserInfoError'))
  })
  return () => {
    userInfoListener()
  }
}

export function setupUpdateListener(): () => void {
  const setIsUpdateDialogOpen = useUpdaterStore.getState().setIsOpen
  console.warn('[DEBUG] app.tsx')

  const removeUpdateAvailableListener = ipcManager.on(
    'updater:update-available',
    (_event, _updateInfo) => {
      setIsUpdateDialogOpen(true)
    }
  )
  return (): void => {
    removeUpdateAvailableListener()
  }
}

/**
 * Setting up all application listeners
 * @param navigate Route Navigation Functions
 * @returns Cleaning up the function array
 */
export async function setup(router: any): Promise<() => void> {
  const cleanupFunctions = [
    setupGameUrlListener(router),
    setupCloudSyncListener(),
    setupGameExitListeners(),
    await setupDBSync(),
    setupUpdateListener(),
    setupFullSyncListener(),
    setupUserInfoListener()
  ]

  return () => {
    cleanupFunctions.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })
  }
}
