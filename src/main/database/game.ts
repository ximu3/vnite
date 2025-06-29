// src/database/GameDBManager.ts
import { DBManager } from './common'
import { convertImage, getImage } from '~/media'
import {
  gameDoc,
  gameDocs,
  gameCollectionDoc,
  gameCollectionDocs,
  gameLocalDoc,
  gameLocalDocs,
  DEFAULT_GAME_VALUES,
  DEFAULT_GAME_LOCAL_VALUES,
  DEFAULT_GAME_COLLECTION_VALUES,
  SortConfig
} from '@appTypes/database'
import { getValueByPath } from '@appUtils'
import type { Get, Paths } from 'type-fest'
import log from 'electron-log/main'
import path from 'path'

export class GameDBManager {
  private static readonly DB_NAME = 'game'

  static async getAllGames(): Promise<gameDocs> {
    try {
      return (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
    } catch (error) {
      log.error('Error getting all games:', error)
      throw error
    }
  }

  static async getAllCollections(): Promise<gameCollectionDocs> {
    try {
      return (await DBManager.getAllDocs(`${this.DB_NAME}-collection`)) as gameCollectionDocs
    } catch (error) {
      log.error('Error getting all collections:', error)
      throw error
    }
  }

  static async getAllGamesLocal(): Promise<gameLocalDocs> {
    try {
      return (await DBManager.getAllDocs(`${this.DB_NAME}-local`)) as gameLocalDocs
    } catch (error) {
      log.error('Error getting all local games:', error)
      throw error
    }
  }

  static async getGame(gameId: string): Promise<gameDoc> {
    try {
      return await DBManager.getValue(this.DB_NAME, gameId, '#all', {} as gameDoc)
    } catch (error) {
      log.error('Error getting game:', error)
      throw error
    }
  }

  static async setGame(gameId: string, data: Partial<gameDoc>): Promise<void> {
    try {
      await DBManager.setValue(this.DB_NAME, gameId, '#all', data)
    } catch (error) {
      log.error('Error setting game:', error)
      throw error
    }
  }

  static async getGameLocal(gameId: string): Promise<gameLocalDoc> {
    try {
      return await DBManager.getValue(`${this.DB_NAME}-local`, gameId, '#all', {} as gameLocalDoc)
    } catch (error) {
      log.error('Error getting local game:', error)
      throw error
    }
  }

  static async setGameLocal(gameId: string, data: Partial<gameLocalDoc>): Promise<void> {
    try {
      await DBManager.setValue(`${this.DB_NAME}-local`, gameId, '#all', data)
    } catch (error) {
      log.error('Error setting local game:', error)
      throw error
    }
  }

  static async getCollection(collectionId: string): Promise<gameCollectionDoc> {
    try {
      return await DBManager.getValue(
        `${this.DB_NAME}-collection`,
        collectionId,
        '#all',
        {} as gameCollectionDoc
      )
    } catch (error) {
      log.error('Error getting collection:', error)
      throw error
    }
  }

  static async setCollection(
    collectionId: string,
    data: Partial<gameCollectionDoc>
  ): Promise<void> {
    try {
      await DBManager.setValue(`${this.DB_NAME}-collection`, collectionId, '#all', data)
    } catch (error) {
      log.error('Error setting collection:', error)
      throw error
    }
  }

  static async getGameValue<Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ): Promise<Get<gameDoc, Path>> {
    try {
      return (await DBManager.getValue(
        this.DB_NAME,
        gameId,
        path,
        getValueByPath(DEFAULT_GAME_VALUES, path)
      )) as Get<gameDoc, Path>
    } catch (error) {
      log.error('Error getting game value:', error)
      throw error
    }
  }

  static async setGameValue<Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameDoc, Path>
  ): Promise<void> {
    try {
      await DBManager.setValue(this.DB_NAME, gameId, path, value)
    } catch (error) {
      log.error('Error setting game value:', error)
      throw error
    }
  }

  static async getCollectionValue<Path extends Paths<gameCollectionDoc, { bracketNotation: true }>>(
    collectionId: string,
    path: Path
  ): Promise<Get<gameCollectionDoc, Path>> {
    try {
      return (await DBManager.getValue(
        `${this.DB_NAME}-collection`,
        collectionId,
        path,
        getValueByPath(DEFAULT_GAME_COLLECTION_VALUES, path)
      )) as Get<gameCollectionDoc, Path>
    } catch (error) {
      log.error('Error getting collection value:', error)
      throw error
    }
  }

  static async setCollectionValue<Path extends Paths<gameCollectionDoc, { bracketNotation: true }>>(
    collectionId: string,
    path: Path,
    value: Get<gameCollectionDoc, Path>
  ): Promise<void> {
    try {
      await DBManager.setValue(`${this.DB_NAME}-collection`, collectionId, path, value)
    } catch (error) {
      log.error('Error setting collection value:', error)
      throw error
    }
  }

  static async getGameLocalValue<Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ): Promise<Get<gameLocalDoc, Path>> {
    try {
      return (await DBManager.getValue(
        `${this.DB_NAME}-local`,
        gameId,
        path,
        getValueByPath(DEFAULT_GAME_LOCAL_VALUES, path)
      )) as Get<gameLocalDoc, Path>
    } catch (error) {
      log.error('Error getting local game value:', error)
      throw error
    }
  }

  static async setGameLocalValue<Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameLocalDoc, Path>
  ): Promise<void> {
    try {
      await DBManager.setValue(`${this.DB_NAME}-local`, gameId, path, value)
    } catch (error) {
      log.error('Error setting local game value:', error)
      throw error
    }
  }

  static async checkGameExitsByPath(path: string): Promise<boolean> {
    try {
      const games = await this.getAllGamesLocal()

      const gameArray = Object.values(games)
      const results = await Promise.all(
        gameArray.map(async (game) => {
          const gamePath = await this.getGameLocalValue(game._id, 'path.gamePath')
          const markPath = await this.getGameLocalValue(game._id, 'utils.markPath')
          return gamePath.includes(path) || markPath === path
        })
      )

      return results.some((result) => result)
    } catch (error) {
      log.error('Error checking game existence by path:', error)
      throw error
    }
  }

  static async removeGame(gameId: string): Promise<void> {
    try {
      await DBManager.removeDoc(this.DB_NAME, gameId)
      await DBManager.removeDoc(`${this.DB_NAME}-local`, gameId)
    } catch (error) {
      log.error('Error removing game:', error)
      throw error
    }
  }

  static async removeCollection(collectionId: string): Promise<void> {
    try {
      await DBManager.removeDoc(`${this.DB_NAME}-collection`, collectionId)
    } catch (error) {
      log.error('Error removing collection:', error)
      throw error
    }
  }

  static async removeGameFromCollection(gameId: string, collectionId: string): Promise<void> {
    try {
      const collection = await this.getCollection(collectionId)
      await this.setCollection(collectionId, {
        games: collection.games.filter((id) => id !== gameId)
      })
    } catch (error) {
      log.error('Error removing game from collection:', error)
      throw error
    }
  }

  static async addGameToCollection(gameId: string, collectionId: string): Promise<void> {
    try {
      const collection = await this.getCollection(collectionId)
      await this.setCollection(collectionId, {
        games: [...collection.games, gameId]
      })
    } catch (error) {
      log.error('Error adding game to collection:', error)
      throw error
    }
  }

  static async removeGameFromAllCollections(gameId: string): Promise<void> {
    try {
      const collections = await this.getAllCollections()
      for (const collectionId in collections) {
        const collection = collections[collectionId]
        if (collection.games.includes(gameId)) {
          await this.setCollection(collectionId, {
            games: collection.games.filter((id) => id !== gameId)
          })
        }
      }
    } catch (error) {
      log.error('Error removing game from all collections:', error)
      throw error
    }
  }

  static async removeGameLocal(gameId: string): Promise<void> {
    try {
      await DBManager.removeDoc(`${this.DB_NAME}-local`, gameId)
    } catch (error) {
      log.error('Error removing local game:', error)
      throw error
    }
  }

  static async setGameImage(
    gameId: string,
    type: 'background' | 'cover' | 'icon' | 'logo',
    image: Buffer | string,
    shouldCompress: boolean,
    compressFactor?: number
  ): Promise<void> {
    try {
      // Remove existing images for this type
      const attachments = await DBManager.listAttachmentNames(this.DB_NAME, gameId);
      for (const name of attachments) {
        if (new RegExp(`^images/${type}\\.[^.]+$`).test(name)) {
          await DBManager.removeAttachment(this.DB_NAME, gameId, name).catch(() => {});
        }
      }

      // Handle image conversion and compression
      let imageBuffer: Buffer
      let imageExtension = 'webp'

      imageBuffer = await getImage(image)

      if (shouldCompress && compressFactor !== undefined) {
        // Compressed version
        imageBuffer = await convertImage(image, 'webp', { quality: compressFactor })
      } else {
        // Uncompressed version
        if (typeof image === 'string') {
          imageExtension = path.extname(image).replace('.', '').toLowerCase()
        } else if (type === 'icon'){ //This case is for when we extract the game's icon
          imageExtension = 'png'
        }
      }

      // Save new image
      await DBManager.putAttachment(
        this.DB_NAME,
        gameId,
        `images/${type}.${imageExtension}`,
        imageBuffer
      );
    } catch (error) {
      log.error('Error setting game image:', error)
      throw error
    }
  }

  static async getGameImage<T extends 'buffer' | 'file' = 'buffer'>(
    gameId: string,
    type: 'background' | 'cover' | 'icon' | 'logo',
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string | null : Buffer | null> {
    try {
      const attachments = await DBManager.listAttachmentNames(this.DB_NAME, gameId);

      const match = attachments.find(name =>
        new RegExp(`^images/${type}\\.[^.]+$`, 'i').test(name)
      );
      if (!match) {
        return null;
      }

      if (format === 'file') {
        return (await DBManager.getAttachment(this.DB_NAME, gameId, match, {
          format: 'file',
          filePath: '#temp',
          ext: match.split('.').pop() || 'bin'
        })) as T extends 'file' ? string | null : Buffer | null;
      } else {
        return (await DBManager.getAttachment(this.DB_NAME, gameId, match)) as T extends 'file' ? string | null : Buffer | null;
      }
    } catch (error) {
      log.error('Error getting game image:', error);
      throw error;
    }
  }

  static async setGameMemoryImage(
    gameId: string,
    memoryId: string,
    image: Buffer | string
  ): Promise<void> {
    try {
      image = await convertImage(image, 'webp')
      await DBManager.putAttachment(this.DB_NAME, gameId, `images/memories/${memoryId}.webp`, image)
    } catch (error) {
      log.error('Error setting game memory image:', error)
      throw error
    }
  }

  static async getGameMemoryImage<T extends 'buffer' | 'file' = 'buffer'>(
    gameId: string,
    memoryId: string,
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string | null : Buffer | null> {
    try {
      if (
        (await DBManager.checkAttachment(
          this.DB_NAME,
          gameId,
          `images/memories/${memoryId}.webp`
        )) === false
      ) {
        return null
      }
      if (format === 'file') {
        return (await DBManager.getAttachment(
          this.DB_NAME,
          gameId,
          `images/memories/${memoryId}.webp`,
          {
            format: 'file',
            filePath: '#temp',
            ext: 'webp'
          }
        )) as T extends 'file' ? string : Buffer
      } else {
        return (await DBManager.getAttachment(
          this.DB_NAME,
          gameId,
          `images/memories/${memoryId}.webp`
        )) as T extends 'file' ? string : Buffer
      }
    } catch (error) {
      log.error('Error getting game memory image:', error)
      throw error
    }
  }

  static async setGameSave(
    gameId: string,
    saveId: string,
    saveData: Buffer | string
  ): Promise<void> {
    try {
      await DBManager.putAttachment(
        this.DB_NAME,
        gameId,
        `saves/${saveId}.zip`,
        saveData,
        'application/zip'
      )
    } catch (error) {
      log.error('Error setting game save:', error)
      throw error
    }
  }

  static async getGameSave<T extends 'buffer' | 'file' = 'buffer'>(
    gameId: string,
    saveId: string,
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string : Buffer> {
    try {
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
    } catch (error) {
      log.error('Error getting game save:', error)
      throw error
    }
  }

  static async removeGameSave(gameId: string, saveId: string): Promise<void> {
    try {
      await DBManager.removeAttachment(this.DB_NAME, gameId, `saves/${saveId}.zip`)
    } catch (error) {
      log.error('Error removing game save:', error)
      throw error
    }
  }

  static async removeGameMemoryImage(gameId: string, memoryId: string): Promise<void> {
    try {
      await DBManager.removeAttachment(this.DB_NAME, gameId, `memories/${memoryId}.webp`)
    } catch (error) {
      log.error('Error removing game memory image:', error)
      throw error
    }
  }

  static async removeGameImage(
    gameId: string,
    type: 'background' | 'cover' | 'icon' | 'logo'
  ): Promise<void> {
    try {
      // Remove existing images for this type
      const attachments = await DBManager.listAttachmentNames(this.DB_NAME, gameId);
      for (const name of attachments) {
        if (new RegExp(`^images/${type}\\.[^.]+$`).test(name)) {
          
          await DBManager.removeAttachment(this.DB_NAME, gameId, name).catch(() => {})
        }
      }
    } catch (error) {
      log.error('Error removing game image:', error)
      throw error
    }
  }

  static async sortGames(sortConfigs: SortConfig | SortConfig[]): Promise<string[]> {
    try {
      const docs = (await DBManager.getAllDocs(this.DB_NAME)) as gameDocs
      const games = Object.values(docs).filter((doc): doc is gameDoc => doc._id !== 'collections')

      // Make sure sortConfigs is an array
      const configs = Array.isArray(sortConfigs) ? sortConfigs : [sortConfigs]

      // sorting function
      const sortedGames = games.sort((a, b) => {
        for (const { by, order = 'asc' } of configs) {
          const aValue = getValueByPath(a, by)
          const bValue = getValueByPath(b, by)

          // Handling of null values
          if (aValue === undefined || aValue === null) return order === 'asc' ? 1 : -1
          if (bValue === undefined || bValue === null) return order === 'asc' ? -1 : 1

          let comparison = 0

          // Comparison based on value type
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

          // If the current fields are not equal, return the comparison result
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison
          }
        }

        return 0 // All fields are equal
      })

      return sortedGames.map((game) => game._id)
    } catch (error) {
      log.error('Error sorting games:', error)
      throw error
    }
  }
}
