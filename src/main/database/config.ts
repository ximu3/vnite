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

export class ConfigDBManager {
  private static readonly DB_NAME = 'config'

  static async getAllConfigs(): Promise<configDocs> {
    return (await DBManager.getAllDocs(this.DB_NAME)) as configDocs
  }

  static async getAllConfigLocal(): Promise<configLocalDocs> {
    return (await DBManager.getAllDocs(`${this.DB_NAME}-local`)) as configLocalDocs
  }

  static async getConfigValue<Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path
  ): Promise<Get<configDocs, Path>> {
    // 直接分割路径获取 docId 和剩余路径
    const [docId, ...restPath] = path.split('.')

    // 构造剩余路径字符串，保持方括号表示法
    const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

    return (await DBManager.getValue(
      this.DB_NAME,
      docId,
      remainingPath,
      getValueByPath(DEFAULT_CONFIG_VALUES, path)
    )) as Get<configDocs, Path>
  }

  static async setConfigValue<Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configDocs, Path>
  ): Promise<void> {
    // 直接分割路径获取 docId 和剩余路径
    const [docId, ...restPath] = path.split('.')

    // 构造剩余路径字符串，保持方括号表示法
    const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

    await DBManager.setValue(this.DB_NAME, docId, remainingPath, value as any)
  }

  static async getConfigLocalValue<Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path
  ): Promise<Get<configLocalDocs, Path>> {
    // 直接分割路径获取 docId 和剩余路径
    const [docId, ...restPath] = path.split('.')

    // 构造剩余路径字符串，保持方括号表示法
    const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

    return (await DBManager.getValue(
      `${this.DB_NAME}-local`,
      docId,
      remainingPath,
      getValueByPath(DEFAULT_CONFIG_LOCAL_VALUES, path)
    )) as Get<configLocalDocs, Path>
  }

  static async setConfigLocalValue<Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configLocalDocs, Path>
  ): Promise<void> {
    // 直接分割路径获取 docId 和剩余路径
    const [docId, ...restPath] = path.split('.')

    // 构造剩余路径字符串，保持方括号表示法
    const remainingPath = restPath.length > 0 ? restPath.join('.') : '#all'

    await DBManager.setValue(`${this.DB_NAME}-local`, docId, remainingPath, value as any)
  }
}
