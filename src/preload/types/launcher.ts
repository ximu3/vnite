export interface LauncherAPI {
  launcherPreset(presetName: string, gameId: string, steamId?: string): Promise<void>
  startGame(gameId: string): void
  stopGame(gameId: string): void
}
