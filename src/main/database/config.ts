// src/database/ConfigDBManager.ts
import { DBManager } from './common'
import { configDocs, DEFAULT_CONFIG_VALUES } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { getValueByPath } from '~/utils'

export class ConfigDBManager {
  private static readonly DB_NAME = 'config'

  /**
   * 获取所有配置
   */
  static async getAllConfigs(): Promise<configDocs> {
    return (await DBManager.getAllDocs(this.DB_NAME)) as configDocs
  }

  /**
   * 获取通用配置
   */
  static async getGeneralConfig(): Promise<configDocs['general']> {
    return await DBManager.getValue(this.DB_NAME, 'general', '#all', DEFAULT_CONFIG_VALUES.general)
  }

  /**
   * 获取同步配置
   */
  static async getSyncConfig(): Promise<configDocs['sync']> {
    return await DBManager.getValue(this.DB_NAME, 'sync', '#all', DEFAULT_CONFIG_VALUES.sync)
  }

  /**
   * 获取游戏配置
   */
  static async getGameConfig(): Promise<configDocs['game']> {
    return await DBManager.getValue(this.DB_NAME, 'game', '#all', DEFAULT_CONFIG_VALUES.game)
  }

  /**
   * 获取外观配置
   */
  static async getAppearancesConfig(): Promise<configDocs['appearances']> {
    return await DBManager.getValue(
      this.DB_NAME,
      'appearances',
      '#all',
      DEFAULT_CONFIG_VALUES.appearances
    )
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

  /**
   * 更新通用配置
   */
  static async updateGeneralConfig(config: Partial<configDocs['general']>): Promise<void> {
    const currentConfig = await this.getGeneralConfig()
    await DBManager.setValue(this.DB_NAME, 'general', '#all', { ...currentConfig, ...config })
  }

  /**
   * 更新同步配置
   */
  static async updateSyncConfig(config: Partial<configDocs['sync']>): Promise<void> {
    const currentConfig = await this.getSyncConfig()
    await DBManager.setValue(this.DB_NAME, 'sync', '#all', { ...currentConfig, ...config })
  }

  /**
   * 更新游戏配置
   */
  static async updateGameConfig(config: Partial<configDocs['game']>): Promise<void> {
    const currentConfig = await this.getGameConfig()
    await DBManager.setValue(this.DB_NAME, 'game', '#all', { ...currentConfig, ...config })
  }

  /**
   * 更新外观配置
   */
  static async updateAppearancesConfig(config: Partial<configDocs['appearances']>): Promise<void> {
    const currentConfig = await this.getAppearancesConfig()
    await DBManager.setValue(this.DB_NAME, 'appearances', '#all', {
      ...currentConfig,
      ...config
    })
  }

  /**
   * 重置指定配置到默认值
   */
  static async resetConfig(docId: keyof configDocs): Promise<void> {
    await DBManager.setValue(this.DB_NAME, docId, '#all', DEFAULT_CONFIG_VALUES[docId])
  }

  /**
   * 重置所有配置到默认值
   */
  static async resetAllConfigs(): Promise<void> {
    const configs = Object.entries(DEFAULT_CONFIG_VALUES)
    for (const [docId, _value] of configs) {
      await this.resetConfig(docId as keyof configDocs)
    }
  }

  // 默认配置值
}
