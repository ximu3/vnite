import { getDBValue, setDBValue } from './services'
import { getDataPath } from '~/utils'
import { BrowserWindow } from 'electron'
import fse from 'fs-extra'

// 定义记录数据的接口
export interface GameRecordData {
  addDate?: string
  lastRunDate?: string
  score?: number
  playingTime?: number
  timer?: string[] // 用于计算 playedTimes
  // 可以添加其他记录相关的字段
}

export class GameRecordManager {
  private static instance: GameRecordManager
  private recordData: Record<string, GameRecordData> = {}

  private constructor() {
    this.initialize()
  }

  public static getInstance(): GameRecordManager {
    if (!GameRecordManager.instance) {
      GameRecordManager.instance = new GameRecordManager()
    }
    return GameRecordManager.instance
  }

  public async initialize(): Promise<void> {
    try {
      const gamesPath = await getDataPath('games')

      // 读取所有游戏文件夹
      const gameFolders = await fse
        .readdir(gamesPath, { withFileTypes: true })
        .then((entries) =>
          entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
        )

      const recordsData: Record<string, GameRecordData> = {}

      // 并行处理所有游戏记录
      await Promise.all(
        gameFolders.map(async (gameId) => {
          try {
            // 读取记录文件中的所有数据
            const record = (await getDBValue(
              `games/${gameId}/record.json`,
              ['#all'],
              {}
            )) as GameRecordData

            // 构建记录数据对象
            recordsData[gameId] = {
              addDate: record.addDate,
              lastRunDate: record.lastRunDate,
              score: record.score ?? -1,
              playingTime: record.playingTime ?? 0,
              timer: record.timer ?? []
            }
          } catch (error) {
            console.error(`Error processing record for game ${gameId}:`, error)
            // 出错时设置默认值
            recordsData[gameId] = {
              addDate: '',
              lastRunDate: '',
              score: -1,
              playingTime: 0,
              timer: []
            }
          }
        })
      )

      this.recordData = recordsData

      // 可以选择是否保存到本地
      // await this.saveRecords()
    } catch (error) {
      console.error('Error initializing game records:', error)
    }
  }

  private async saveRecords(): Promise<void> {
    try {
      await setDBValue('gameRecords.json', ['#all'], this.recordData)
    } catch (error) {
      console.error('Error saving game records:', error)
    }
  }

  public getRecords(): Record<string, GameRecordData> {
    return this.recordData
  }

  public async updateRecord(gameId: string, data: Partial<GameRecordData>): Promise<void> {
    try {
      // 更新内存中的数据
      this.recordData[gameId] = {
        ...this.recordData[gameId],
        ...data
      }

      // 更新文件系统中的数据
      await setDBValue(`games/${gameId}/record.json`, Object.keys(data), data)

      // 通知渲染进程记录已更新
      const mainWindow = BrowserWindow.getAllWindows()[0]
      mainWindow.webContents.send('game-records-changed', this.recordData)
    } catch (error) {
      console.error(`Error updating record for game ${gameId}:`, error)
    }
  }

  public async rebuild(): Promise<void> {
    await this.initialize()
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('game-records-changed', this.recordData)
  }

  public async removeGameRecord(gameId: string): Promise<void> {
    delete this.recordData[gameId]
    await this.saveRecords()
  }
}

// 导出实例方法
export const getGameRecords = GameRecordManager.getInstance().getRecords.bind(
  GameRecordManager.getInstance()
)

export const updateGameRecord = GameRecordManager.getInstance().updateRecord.bind(
  GameRecordManager.getInstance()
)

export const rebuildRecords = GameRecordManager.getInstance().rebuild.bind(
  GameRecordManager.getInstance()
)

export const initializeRecords = GameRecordManager.getInstance().initialize.bind(
  GameRecordManager.getInstance()
)

export const removeGameRecord = GameRecordManager.getInstance().removeGameRecord.bind(
  GameRecordManager.getInstance()
)
