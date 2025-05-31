export interface EventsAPI {
  onWindowMaximized(listener: () => void): () => void
  onWindowUnmaximized(listener: () => void): () => void
  onStartGameFromUrl(
    listener: (gameId: string, gamePath?: string, mode?: string, config?: any) => void
  ): () => void
  onGameLaunched(listener: (gameId: string) => void): () => void
  onGameExited(listener: (gameId: string, playtime: number) => void): () => void
  onCloudSyncStatus(listener: (status: any) => void): () => void
  onFullSyncing(listener: () => void): () => void
  onFullSynced(listener: () => void): () => void
  onFullSyncError(listener: (error: string) => void): () => void
  onScanProgress(listener: (progress: any) => void): () => void
  onScanCompleted(listener: (progress: any) => void): () => void
  onScanError(listener: (progress: any) => void): () => void
  onScanPaused(listener: (progress: any) => void): () => void
  onScanResumed(listener: (progress: any) => void): () => void
  onScanStopped(listener: (progress: any) => void): () => void
  onScanFolderError(listener: (progress: any) => void): () => void
  onScanFolderFixed(listener: (progress: any) => void): () => void
  onUpdateAvailable(listener: (updateInfo: any) => void): () => void
  onUpdateUserInfoError(listener: () => void): () => void
  on(channel: string, listener: (...args: any[]) => void): () => void
  removeAllListeners(channel: string): void
}
