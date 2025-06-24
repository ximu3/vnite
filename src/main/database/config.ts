// src/database/ConfigDBManager.ts
import { DBManager } from './common'
import {
  configDocs,
  DEFAULT_CONFIG_VALUES,
  configLocalDocs,
  DEFAULT_CONFIG_LOCAL_VALUES
} from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { getValueByPath } from '@appUtils'
import log from 'electron-log/main'
import { convertImage } from '~/media'

export class ConfigDBManager {
  private static readonly DB_NAME = 'config'

  static async getAllConfigs(): Promise<configDocs> {
    try {
      return (await DBManager.getAllDocs(this.DB_NAME)) as configDocs
    } catch (error) {
      log.error('Error getting all configs:', error)
      throw error
    }
  }

  static async getAllConfigLocal(): Promise<configLocalDocs> {
    try {
      return (await DBManager.getAllDocs(`${this.DB_NAME}-local`)) as configLocalDocs
    } catch (error) {
      log.error('Error getting all local configs:', error)
      throw error
    }
  }

  static async getConfigValue<Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path
  ): Promise<Get<configDocs, Path>> {
    try {
      // Split path to get docId and remaining path
      const [docId, ...restPath] = path.split('.')

      // Construct the remaining path string
      const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

      return (await DBManager.getValue(
        this.DB_NAME,
        docId,
        remainingPath,
        getValueByPath(DEFAULT_CONFIG_VALUES, path)
      )) as Get<configDocs, Path>
    } catch (error) {
      log.error('Error getting config value:', error)
      throw error
    }
  }

  static async setConfigValue<Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configDocs, Path>
  ): Promise<void> {
    try {
      // Split path to get docId and remaining path
      const [docId, ...restPath] = path.split('.')

      // Constructs the remaining path string
      const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

      await DBManager.setValue(this.DB_NAME, docId, remainingPath, value as any)
    } catch (error) {
      log.error('Error setting config value:', error)
      throw error
    }
  }

  static async getConfigLocalValue<Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path
  ): Promise<Get<configLocalDocs, Path>> {
    try {
      // Split path to get docId and remaining path
      const [docId, ...restPath] = path.split('.')

      // Constructs the remaining path string
      const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

      return (await DBManager.getValue(
        `${this.DB_NAME}-local`,
        docId,
        remainingPath,
        getValueByPath(DEFAULT_CONFIG_LOCAL_VALUES, path)
      )) as Get<configLocalDocs, Path>
    } catch (error) {
      log.error('Error getting local config value:', error)
      throw error
    }
  }

  static async setConfigLocalValue<Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configLocalDocs, Path>
  ): Promise<void> {
    try {
      // Split path to get docId and remaining path
      const [docId, ...restPath] = path.split('.')

      // Construct the remaining path string
      const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

      await DBManager.setValue(`${this.DB_NAME}-local`, docId, remainingPath, value as any)
    } catch (error) {
      log.error('Error setting local config value:', error)
      throw error
    }
  }

  static async setConfigBackgroundImages(images: (Buffer | string)[]): Promise<void> {
    try {

      //Remove any attachment that matches background pattern name
      const attachments = await DBManager.listAttachmentNames(this.DB_NAME, 'media');

      for (const name of attachments) {
        if (name === 'background.webp' || /^background-\d+\.webp$/.test(name)) {
          await DBManager.removeAttachment(this.DB_NAME, 'media', name).catch(() => {});
        }
      }

      //Save new images as background-1.webp, background-2.webp, ...
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const webpImage = await convertImage(image, 'webp');
        const attachmentName = `background-${i + 1}.webp`;
        await DBManager.putAttachment(
          this.DB_NAME,
          'media',
          attachmentName,
          webpImage,
          'image/webp'
        );
      }
    } catch (error) {
      log.error('Error setting background image(s):', error)
      throw error
    }
  }

  static async getConfigBackgroundImage<T extends 'buffer' | 'file' = 'buffer'>(
    format: T = 'buffer' as T
  ): Promise<T extends 'file' ? string | null : Buffer | null> {
    try {
      if ((await DBManager.checkAttachment(this.DB_NAME, 'media', 'background-1.webp')) === false) {
        return null
      }

      if (format === 'file') {
        return (await DBManager.getAttachment(this.DB_NAME, 'media', 'background-1.webp', {
          format: 'file',
          filePath: '#temp',
          ext: 'webp'
        })) as T extends 'file' ? string : Buffer
      } else {
        return (await DBManager.getAttachment(
          this.DB_NAME,
          'media',
          'background-1.webp'
        )) as T extends 'file' ? string : Buffer
      }
    } catch (error) {
      log.error('Error getting background image:', error)
      throw error
    }
  }
}
