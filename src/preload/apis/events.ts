import { ipcRenderer } from 'electron'

// Listener registration map
const registeredListeners: Record<string, Map<(...args: any[]) => void, () => void>> = {}

// Unique listener registration
function onUnique(channel: string, listener: (...args: any[]) => void): () => void {
  if (!registeredListeners[channel]) {
    registeredListeners[channel] = new Map()
  }

  if (registeredListeners[channel].has(listener)) {
    console.warn(`Listener already registered for channel "${channel}", skipping.`)
    return registeredListeners[channel].get(listener) as () => void
  }

  const wrappedListener = (_event: any, ...args: any[]): void => {
    listener(...args)
  }

  ipcRenderer.on(channel, wrappedListener)

  const removeListener = (): void => {
    ipcRenderer.removeListener(channel, wrappedListener)
    registeredListeners[channel].delete(listener)
    if (registeredListeners[channel].size === 0) {
      delete registeredListeners[channel]
    }
  }

  registeredListeners[channel].set(listener, removeListener)
  return removeListener
}

export const eventsAPI = {
  // Window events
  onWindowMaximized(listener: () => void): () => void {
    return onUnique('window-maximized', listener)
  },

  onWindowUnmaximized(listener: () => void): () => void {
    return onUnique('window-unmaximized', listener)
  },

  // Game events
  onStartGameFromUrl(
    listener: (gameId: string, gamePath?: string, mode?: string, config?: any) => void
  ): () => void {
    return onUnique('start-game-from-url', listener)
  },

  onGameLaunched(listener: (gameId: string) => void): () => void {
    return onUnique('game-launched', listener)
  },

  onGameExited(listener: (gameId: string, playtime: number) => void): () => void {
    return onUnique('game-exited', listener)
  },

  // Cloud sync events
  onCloudSyncStatus(listener: (status: any) => void): () => void {
    return onUnique('cloud-sync-status', listener)
  },

  onFullSyncing(listener: () => void): () => void {
    return onUnique('full-syncing', listener)
  },

  onFullSynced(listener: () => void): () => void {
    return onUnique('full-synced', listener)
  },

  onFullSyncError(listener: (error: string) => void): () => void {
    return onUnique('full-sync-error', listener)
  },

  // Scanner events
  onScanProgress(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-progress', listener)
  },

  onScanCompleted(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-completed', listener)
  },

  onScanError(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-error', listener)
  },

  onScanPaused(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-paused', listener)
  },

  onScanResumed(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-resumed', listener)
  },

  onScanStopped(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-stopped', listener)
  },

  onScanFolderError(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-folder-error', listener)
  },

  onScanFolderFixed(listener: (progress: any) => void): () => void {
    return onUnique('game-scanner:scan-folder-fixed', listener)
  },

  // Update events
  onUpdateAvailable(listener: (updateInfo: any) => void): () => void {
    return onUnique('update-available', listener)
  },

  onUpdateUserInfoError(listener: () => void): () => void {
    return onUnique('update-user-info-error', listener)
  },

  // General event listener
  on(channel: string, listener: (...args: any[]) => void): () => void {
    const wrappedListener = (_event: any, ...args: any[]): void => {
      listener(...args)
    }
    ipcRenderer.on(channel, wrappedListener)

    return (): void => {
      ipcRenderer.removeListener(channel, wrappedListener)
    }
  },

  removeAllListeners(channel: string): void {
    ipcRenderer.removeAllListeners(channel)
  }
}
