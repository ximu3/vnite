// src/database/GameDBManager.ts
import { DBManager } from './common'
import { convertToWebP } from '~/media'
import type { gameDoc, gameDocs, gameCollectionDoc } from '@appTypes/database'

export class GameDBManager {
  private static readonly DB_NAME = 'game'

  static async getAllGames(): Promise<gameDocs> {
    return (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
  }

  static async getGameCollection(): Promise<gameCollectionDoc> {
    const docs = (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
    const collections = docs.collections
    return collections || []
  }

  // 获取游戏数据
  static async getGame(gameId: string): Promise<gameDoc> {
    return await DBManager.getValue(this.DB_NAME, gameId, ['#all'], {} as gameDoc)
  }

  // 设置游戏数据
  static async setGame(gameId: string, data: Partial<gameDoc>): Promise<void> {
    await DBManager.setValue(this.DB_NAME, gameId, ['#all'], data)
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
  static async sortGames(by: string[], order: 'asc' | 'desc' = 'asc'): Promise<string[]> {
    const docs = (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
    const games = Object.values(docs).filter((doc): doc is gameDoc => doc._id !== 'collections')

    // 获取嵌套属性值的函数
    const getNestedValue = (obj: any, path: string[]): any => {
      return path.reduce((acc, part) => {
        if (acc === null || acc === undefined) return acc
        return acc[part]
      }, obj)
    }

    // 排序函数
    const sortedGames = games.sort((a, b) => {
      const aValue = getNestedValue(a, by)
      const bValue = getNestedValue(b, by)

      // 处理空值
      if (aValue === undefined || aValue === null) return order === 'asc' ? 1 : -1
      if (bValue === undefined || bValue === null) return order === 'asc' ? -1 : 1

      // 根据值类型进行比较
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return order === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // 处理数组
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        const aStr = aValue.join(',')
        const bStr = bValue.join(',')
        return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      }

      // 默认转换为字符串比较
      return order === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

    return sortedGames.map((game) => game._id)
  }
}
