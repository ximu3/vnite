// src/database/GameDBManager.ts
import { DBManager } from './common'
import { convertToWebP } from '~/media'
import {
  gameDoc,
  gameDocs,
  gameCollectionDoc,
  gameCollection,
  DEFAULT_GAME_VALUES,
  SortConfig
} from '@appTypes/database'
import { getValueByPath } from '~/utils'
import type { Get, Paths } from 'type-fest'

export class GameDBManager {
  private static readonly DB_NAME = 'game'

  static async getAllGames(): Promise<gameDocs> {
    return (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
  }

  static async getAllCollections(): Promise<gameCollectionDoc> {
    return await DBManager.getValue(this.DB_NAME, 'collections', '#all', {} as gameCollectionDoc)
  }

  // 获取游戏数据
  static async getGame(gameId: string): Promise<gameDoc> {
    return await DBManager.getValue(this.DB_NAME, gameId, '#all', {} as gameDoc)
  }

  // 设置游戏数据
  static async setGame(gameId: string, data: Partial<gameDoc>): Promise<void> {
    await DBManager.setValue(this.DB_NAME, gameId, '#all', data)
  }

  static async getCollection(collectionId: string): Promise<gameCollection> {
    return await DBManager.getValue(
      `${this.DB_NAME}-collection`,
      collectionId,
      '#all',
      {} as gameCollection
    )
  }

  static async setCollection(collectionId: string, data: Partial<gameCollection>): Promise<void> {
    await DBManager.setValue(`${this.DB_NAME}-collection`, collectionId, '#all', data)
  }

  static async getGameValue<Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ): Promise<Get<gameDoc, Path>> {
    return (await DBManager.getValue(
      this.DB_NAME,
      gameId,
      path,
      getValueByPath(DEFAULT_GAME_VALUES, path)
    )) as Get<gameDoc, Path>
  }

  static async setGameValue<Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameDoc, Path>
  ): Promise<void> {
    await DBManager.setValue(this.DB_NAME, gameId, path, value)
  }

  static async removeGame(gameId: string): Promise<void> {
    await DBManager.removeDoc(this.DB_NAME, gameId)
  }

  // 处理游戏图片
  static async setGameImage(
    gameId: string,
    type: 'background' | 'cover' | 'icon' | 'logo',
    image: Buffer | string
  ): Promise<void> {
    image = await convertToWebP(image)
    await DBManager.putAttachment(this.DB_NAME, gameId, `images/${type}.webp`, image)
  }

  static async getGameImage<T extends 'buffer' | 'file' = 'buffer'>(
    gameId: string,
    type: 'background' | 'cover' | 'icon' | 'logo',
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string : Buffer> {
    if (format === 'file') {
      return (await DBManager.getAttachment(this.DB_NAME, gameId, `images/${type}.webp`, {
        format: 'file',
        filePath: '#temp',
        ext: 'webp'
      })) as T extends 'file' ? string : Buffer
    } else {
      return (await DBManager.getAttachment(
        this.DB_NAME,
        gameId,
        `images/${type}.webp`
      )) as T extends 'file' ? string : Buffer
    }
  }

  static async setGameMemoryImage(
    gameId: string,
    memoryId: string,
    image: Buffer | string
  ): Promise<void> {
    image = await convertToWebP(image)
    await DBManager.putAttachment(this.DB_NAME, gameId, `memories/${memoryId}.webp`, image)
  }

  static async getGameMemoryImage<T extends 'buffer' | 'file' = 'buffer'>(
    gameId: string,
    memoryId: string,
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string : Buffer> {
    if (format === 'file') {
      return (await DBManager.getAttachment(this.DB_NAME, gameId, `memories/${memoryId}.webp`, {
        format: 'file',
        filePath: '#temp',
        ext: 'webp'
      })) as T extends 'file' ? string : Buffer
    } else {
      return (await DBManager.getAttachment(
        this.DB_NAME,
        gameId,
        `memories/${memoryId}.webp`
      )) as T extends 'file' ? string : Buffer
    }
  }

  static async setGameSave(
    gameId: string,
    saveId: string,
    saveData: Buffer | string
  ): Promise<void> {
    await DBManager.putAttachment(
      this.DB_NAME,
      gameId,
      `saves/${saveId}.zip`,
      saveData,
      'application/zip'
    )
  }

  static async getGameSave<T extends 'buffer' | 'file' = 'buffer'>(
    gameId: string,
    saveId: string,
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string : Buffer> {
    if (format === 'file') {
      return (await DBManager.getAttachment(this.DB_NAME, gameId, `saves/${saveId}.zip`, {
        format: 'file',
        filePath: '#temp',
        ext: 'zip'
      })) as T extends 'file' ? string : Buffer
    } else {
      return (await DBManager.getAttachment(
        this.DB_NAME,
        gameId,
        `saves/${saveId}.zip`
      )) as T extends 'file' ? string : Buffer
    }
  }

  static async removeGameSave(gameId: string, saveId: string): Promise<void> {
    await DBManager.removeAttachment(this.DB_NAME, gameId, `saves/${saveId}.zip`)
  }

  static async removeGameMemoryImage(gameId: string, memoryId: string): Promise<void> {
    await DBManager.removeAttachment(this.DB_NAME, gameId, `memories/${memoryId}.webp`)
  }

  static async removeGameImage(
    gameId: string,
    type: 'background' | 'cover' | 'icon' | 'logo'
  ): Promise<void> {
    await DBManager.removeAttachment(this.DB_NAME, gameId, `images/${type}.webp`)
  }

  /**
   * 对游戏进行排序
   * @param by 排序字段路径数组，如 ['metadata', 'name'] 或 ['record', 'playTime']
   * @param order 排序顺序，默认为 'asc'
   */
  static async sortGames(sortConfigs: SortConfig | SortConfig[]): Promise<string[]> {
    const docs = (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
    const games = Object.values(docs).filter((doc): doc is gameDoc => doc._id !== 'collections')

    // 确保 sortConfigs 是数组
    const configs = Array.isArray(sortConfigs) ? sortConfigs : [sortConfigs]

    // 排序函数
    const sortedGames = games.sort((a, b) => {
      for (const { by, order = 'asc' } of configs) {
        const aValue = getValueByPath(a, by)
        const bValue = getValueByPath(b, by)

        // 处理空值
        if (aValue === undefined || aValue === null) return order === 'asc' ? 1 : -1
        if (bValue === undefined || bValue === null) return order === 'asc' ? -1 : 1

        let comparison = 0

        // 根据值类型进行比较
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue)
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime()
        } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
          comparison = aValue.join(',').localeCompare(bValue.join(','))
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        // 如果当前字段不相等，返回比较结果
        if (comparison !== 0) {
          return order === 'asc' ? comparison : -comparison
        }
      }

      return 0 // 所有字段都相等
    })

    return sortedGames.map((game) => game._id)
  }
}
