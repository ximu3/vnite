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
    'playedTimes'
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
            const addDate = await getDBValue(`games/${gameId}/record.json`, ['addDate'], {})
            const lastRunDate = await getDBValue(`games/${gameId}/record.json`, ['lastRunDate'], '')
            const score = await getDBValue(`games/${gameId}/record.json`, ['score'], -1)
            const playingTime = await getDBValue(`games/${gameId}/record.json`, ['playingTime'], 0)
            const timer = await getDBValue(`games/${gameId}/record.json`, ['timer'], [])
            const playedTimes = timer.length

            const fullData = {
              id: gameId, // 确保 id 字段存在
              ...metadata,
              addDate,
              lastRunDate,
              score,
              playingTime,
              playedTimes
            }

            const indexedData: Partial<GameIndexdata> = {}

            // 只包含定义的字段
            this.gameIndexdataKeys.forEach((field) => {
              if (fullData[field] !== undefined) {
                indexedData[field] = fullData[field]
              }
            })

            indexData[gameId] = indexedData
          } catch (error) {
            console.error(`Error processing game ${gameId}:`, error)
            indexData[gameId] = { id: gameId } // 返回最小数据集
          }
        })
      )

      this.gameIndex = indexData

      // 储存在本地
      // await this.saveIndex()
    } catch (error) {
      console.error('Error initializing game index:', error)
      // 发生错误时保持现有索引不变
    }
  }

  private async saveIndex(): Promise<void> {
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

  // 新增：删除游戏索引
  public async removeGame(gameId: string): Promise<void> {
    delete this.gameIndex[gameId]
    await this.saveIndex()
  }
}

// 导出实例方法
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
