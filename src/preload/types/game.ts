export interface GameAPI {
  setGameImage(
    gameId: string,
    type: 'background' | 'cover' | 'logo' | 'icon',
    image: string,
    shouldCompress: boolean,
    compressFactor?: number
  ): Promise<void>
  deleteGameSave(gameId: string, saveId: string): Promise<void>
  restoreGameSave(gameId: string, saveId: string): Promise<void>
  deleteGame(gameId: string): Promise<void>
  addMemory(gameId: string): Promise<void>
  deleteMemory(gameId: string, memoryId: string): Promise<void>
  updateMemoryCover(gameId: string, memoryId: string, imgPath: string): Promise<void>
  getMemoryCoverPath(gameId: string, memoryId: string): Promise<string>
  getGameMediaPath(gameId: string, type: 'cover' | 'background' | 'icon' | 'logo'): Promise<string>
  removeGameMedia(gameId: string, type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void>
  checkGameExitsByPath(gamePath: string): Promise<boolean>
}
