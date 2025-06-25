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
import path from 'path'
import fs from 'fs/promises'

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

  static async setConfigBackgroundImages(images: (Buffer | string)[], shouldCompress: boolean,
  compressFactor?: number): Promise<void> {
    try {

      //Remove any attachment that matches background pattern name
      const attachments = await DBManager.listAttachmentNames(this.DB_NAME, 'media');

      for (const name of attachments) {
        if (/^background-\d+\.[^.]+$/.test(name)) {
          await DBManager.removeAttachment(this.DB_NAME, 'media', name).catch(() => {});
        }
      }

      //Save new images as background-1.{ext}, background-2.{ext}...
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        //The images will be compressed
        if (shouldCompress === true && compressFactor !== null)
        {
          const convertedImage = await convertImage(image, 'webp', {quality: compressFactor});
          const attachmentName = `background-${i + 1}.webp`;
          await DBManager.putAttachment(
          this.DB_NAME,
          'media',
          attachmentName,
          convertedImage
        );
        }
        //The images will not be compressed
        else{
          let imageBuffer: Buffer;
          let imageExtension: string;
          if (typeof image === 'string') {
            imageBuffer = await fs.readFile(image);
            imageExtension = path.extname(image).replace('.', '').toLowerCase();
          }
          else {
            imageBuffer = image
            imageExtension = 'webp' //If the image is a buffer already, we cannot infer the extension, so as a safeguard we use webp
          }
          const attachmentName = `background-${i + 1}.${imageExtension}`;
          await DBManager.putAttachment(
          this.DB_NAME,
          'media',
          attachmentName,
          imageBuffer
        );
        }
      }
    } catch (error) {
      log.error('Error setting background image(s):', error)
      throw error
    }
  }

  static async getConfigBackgroundImage<T extends 'buffer' | 'file' = 'buffer'>(
  format: T = 'buffer' as T,
  namesOnly: boolean = false
  ): Promise<
    | string[] // if namesOnly is true
    | Array<{ name: string, data: T extends 'file' ? string : Buffer }> // if namesOnly is false
  > {
    try {

      //Filter for background-<number>.<ext>
      const attachments = await DBManager.listAttachmentNames(this.DB_NAME, 'media');

      const images = attachments
        .filter(name => /^background-\d+\.[a-z0-9]+$/i.test(name))
        .sort((a, b) => {
          const numA = parseInt(a.match(/^background-(\d+)\./)?.[1] || '0', 10);
          const numB = parseInt(b.match(/^background-(\d+)\./)?.[1] || '0', 10);
          return numA - numB;
        });

      //Return just names if requested
      if (namesOnly) return images as any;

      //Otherwise, return array of { name, data }
      return await Promise.all(
        images.map(async name => {
          if (format === 'file') {
            const ext = name.split('.').pop();
            const filePath = '#temp'; // or generate a unique temp path if needed
            const file = await DBManager.getAttachment(this.DB_NAME, 'media', name, {
              format: 'file',
              filePath,
              ext
            });
            return { name, data: file as T extends 'file' ? string : Buffer };
          } else {
            const buffer = await DBManager.getAttachment(this.DB_NAME, 'media', name);
            return { name, data: buffer as T extends 'file' ? string : Buffer };
          }
        })
      ) as any;
    } catch (error) {
      log.error('Error getting background image(s):', error);
      throw error;
    }
  }
}
