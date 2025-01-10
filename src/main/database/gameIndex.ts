import { getDBValue, setDBValue } from './services'
import { getDataPath } from '~/utils'
import { BrowserWindow } from 'electron'
import fse from 'fs-extra'

export interface GameIndexdata {
  id: string
  name: string
  releaseDate: string
  developers: string[]
  category: string
  publishers: string[]
  genres: string[]
  tags: string[]
  addDate: string
  lastRunDate: string
  score: number
  playingTime: number
  playedTimes: number
  playStatus: string
}

export class GameIndexManager {
  private static instance: GameIndexManager
  private gameIndex: Record<string, Partial<GameIndexdata>> = {}
  private gameIndexdataKeys: (keyof GameIndexdata)[] = [
    'id',
    'name',
    'releaseDate',
    'developers',
    'category',
    'publishers',
    'genres',
    'tags',
    'addDate',
    'lastRunDate',
    'score',
    'playingTime',
    'playedTimes',
    'playStatus'
  ]

  private constructor() {
    this.initialize()
  }

  public static getInstance(): GameIndexManager {
    if (!GameIndexManager.instance) {
      GameIndexManager.instance = new GameIndexManager()
    }
    return GameIndexManager.instance
  }

  public async initialize(): Promise<void> {
    try {
      const gamesPath = await getDataPath('games')

      const gameFolders = await fse
        .readdir(gamesPath, { withFileTypes: true })
        .then((entries) =>
          entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
        )

      const indexData: Record<string, Partial<GameIndexdata>> = {}

      await Promise.all(
        gameFolders.map(async (gameId) => {
          try {
            const metadata = await getDBValue(`games/${gameId}/metadata.json`, ['#all'], {})
            const addDate = await getDBValue(`games/${gameId}/record.json`, ['addDate'], '')
            const lastRunDate = await getDBValue(`games/${gameId}/record.json`, ['lastRunDate'], '')
            const score = await getDBValue(`games/${gameId}/record.json`, ['score'], -1)
            const playingTime = await getDBValue(`games/${gameId}/record.json`, ['playingTime'], 0)
            const timer = await getDBValue(`games/${gameId}/record.json`, ['timer'], [])
            const playedTimes = timer.length
            const playStatus = await getDBValue(
              `games/${gameId}/record.json`,
              ['playStatus'],
              'unplayed'
            )

            const fullData = {
              id: gameId,
              ...metadata,
              addDate,
              lastRunDate,
              score,
              playingTime,
              playedTimes,
              playStatus
            }

            const indexedData: Partial<GameIndexdata> = {}

            // Contains only defined fields
            this.gameIndexdataKeys.forEach((field) => {
              if (fullData[field] !== undefined) {
                indexedData[field] = fullData[field]
              }
            })

            indexData[gameId] = indexedData
          } catch (error) {
            console.error(`Error processing game ${gameId}:`, error)
            indexData[gameId] = { id: gameId } // Returns the smallest data set
          }
        })
      )

      this.gameIndex = indexData
    } catch (error) {
      console.error('Error initializing game index:', error)
      // Keeping existing indexes intact in the event of an error
    }
  }

  public async saveIndex(): Promise<void> {
    try {
      await setDBValue('gameIndex.json', ['#all'], this.gameIndex)
    } catch (error) {
      console.error('Error saving game index:', error)
    }
  }

  public getGameIndex(): Record<string, Partial<GameIndexdata>> {
    return this.gameIndex
  }

  public async rebuild(): Promise<void> {
    await this.initialize()
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('game-index-changed')
  }

  public async updateGame(gameId: string): Promise<void> {
    try {
      const metadata = await getDBValue(`games/${gameId}/metadata.json`, ['#all'], {})
      const addDate = await getDBValue(`games/${gameId}/record.json`, ['addDate'], '')
      const lastRunDate = await getDBValue(`games/${gameId}/record.json`, ['lastRunDate'], '')
      const score = await getDBValue(`games/${gameId}/record.json`, ['score'], -1)
      const playingTime = await getDBValue(`games/${gameId}/record.json`, ['playingTime'], 0)
      const timer = await getDBValue(`games/${gameId}/record.json`, ['timer'], [])
      const playedTimes = timer.length
      const playStatus = await getDBValue(`games/${gameId}/record.json`, ['playStatus'], 'unplayed')

      const fullData = {
        id: gameId,
        ...metadata,
        addDate,
        lastRunDate,
        score,
        playingTime,
        playedTimes,
        playStatus
      }

      const indexedData: Partial<GameIndexdata> = {}

      this.gameIndexdataKeys.forEach((field) => {
        if (fullData[field] !== undefined) {
          indexedData[field] = fullData[field]
        }
      })

      this.gameIndex[gameId] = indexedData
      const mainWindow = BrowserWindow.getAllWindows()[0]
      mainWindow.webContents.send('game-index-changed')
    } catch (error) {
      console.error(`Error updating game ${gameId}:`, error)
    }
  }

  public async removeGame(gameId: string): Promise<void> {
    delete this.gameIndex[gameId]
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('game-index-changed')
  }

  public sort(by: keyof GameIndexdata, order: 'asc' | 'desc' = 'asc'): string[] {
    return Object.entries(this.gameIndex)
      .sort(([, a], [, b]) => {
        const valueA = a[by]
        const valueB = b[by]

        // 检查 valueA 和 valueB 是否为 undefined 或 null
        if (valueA == null && valueB == null) {
          return 0
        }
        if (valueA == null) {
          return order === 'asc' ? 1 : -1
        }
        if (valueB == null) {
          return order === 'asc' ? -1 : 1
        }

        if (valueA === valueB) {
          return 0
        }
        return order === 'asc' ? (valueA > valueB ? 1 : -1) : valueA > valueB ? -1 : 1
      })
      .map(([gameId]) => gameId)
  }
}

export const getGameIndex = GameIndexManager.getInstance().getGameIndex.bind(
  GameIndexManager.getInstance()
)

export const rebuildIndex = GameIndexManager.getInstance().rebuild.bind(
  GameIndexManager.getInstance()
)

export const initializeIndex = GameIndexManager.getInstance().initialize.bind(
  GameIndexManager.getInstance()
)

export const removeGameIndex = GameIndexManager.getInstance().removeGame.bind(
  GameIndexManager.getInstance()
)

export const updateGameIndex = GameIndexManager.getInstance().updateGame.bind(
  GameIndexManager.getInstance()
)

export const saveIndex = GameIndexManager.getInstance().saveIndex.bind(
  GameIndexManager.getInstance()
)

export const sortGameIndex = GameIndexManager.getInstance().sort.bind(
  GameIndexManager.getInstance()
)
