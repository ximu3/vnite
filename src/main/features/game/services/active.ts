import log from 'electron-log/main'

export class ActiveGameInfo {
  static infos: {
    gameId: string
    process: {
      pid: number
      path: string
      name?: string
    }[]
  }[] = []

  static updateGameInfo(
    gameId: string,
    process?: { pid: number; path: string; name?: string }
  ): void {
    // Find existing game information
    let gameInfo = this.infos.find((info) => info.gameId === gameId)

    // If not found, create new game information and add to array
    if (!gameInfo) {
      gameInfo = { gameId, process: [] }
      this.infos.push(gameInfo)
    }

    // If process is provided, update or add it
    if (process) {
      const existingProcess = gameInfo.process.find((p) => p.pid === process.pid)
      if (!existingProcess) {
        gameInfo.process.push(process)
        log.info(`[Game] Updated active game info for ${gameId}:`, gameInfo)
      } else {
        existingProcess.path = process.path
        existingProcess.name = process.name
      }
    }
  }

  static removeGameInfo(gameId: string): void {
    // Find the index of the game information
    const index = this.infos.findIndex((info) => info.gameId === gameId)

    // If found, remove it from the array
    if (index !== -1) {
      this.infos.splice(index, 1)
    }

    log.info(`[Game] Removed active game info for ${gameId}`)
  }

  static getGameInfoByPid(
    pid: number
  ): { gameId: string; process: { pid: number; path: string; name?: string }[] } | null {
    // Iterate through all game information to find matching process
    for (const gameInfo of this.infos) {
      const process = gameInfo.process.find((p) => p.pid === pid)
      if (process) {
        return gameInfo
      }
    }

    return null
  }
}
