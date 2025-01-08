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
  timer?: string[]
  // Additional record-related fields can be added
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

      // Read all game folders
      const gameFolders = await fse
        .readdir(gamesPath, { withFileTypes: true })
        .then((entries) =>
          entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
        )

      const recordsData: Record<string, GameRecordData> = {}

      // Parallel processing of all game records
      await Promise.all(
        gameFolders.map(async (gameId) => {
          try {
            // Read all data in the log file
            const record = (await getDBValue(
              `games/${gameId}/record.json`,
              ['#all'],
              {}
            )) as GameRecordData

            // Constructing Recorded Data Objects
            recordsData[gameId] = {
              addDate: record.addDate,
              lastRunDate: record.lastRunDate,
              score: record.score ?? -1,
              playingTime: record.playingTime ?? 0,
              timer: record.timer ?? []
            }
          } catch (error) {
            console.error(`Error processing record for game ${gameId}:`, error)
            // Setting default values on error
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
    } catch (error) {
      console.error('Error initializing game records:', error)
    }
  }

  public async saveRecords(): Promise<void> {
    try {
      await setDBValue('gameRecords.json', ['#all'], this.recordData)
    } catch (error) {
      console.error('Error saving game records:', error)
    }
  }

  public getRecords(): Record<string, GameRecordData> {
    return this.recordData
  }

  public async updateRecord(gameId: string): Promise<void> {
    try {
      const record = (await getDBValue(
        `games/${gameId}/record.json`,
        ['#all'],
        {}
      )) as GameRecordData

      this.recordData[gameId] = {
        addDate: record.addDate,
        lastRunDate: record.lastRunDate,
        score: record.score ?? -1,
        playingTime: record.playingTime ?? 0,
        timer: record.timer ?? []
      }

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
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('game-records-changed', this.recordData)
  }
}

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

export const saveGameRecords = GameRecordManager.getInstance().saveRecords.bind(
  GameRecordManager.getInstance()
)
