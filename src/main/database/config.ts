// src/database/ConfigDBManager.ts
import { DBManager } from './common'
import type { configDocs } from '@appTypes/database'

export class ConfigDBManager {
  private static readonly DB_NAME = 'config'

  // 默认配置值
  private static readonly DEFAULT_VALUES = {
    general: {
      openAtLogin: false,
      quitToTray: true
    },
    sync: {
      enabled: true,
      mode: 'offical',
      officalConfig: {
        auth: {
          username: 'ximu',
          password: '001500szm'
        }
      },
      selfHostedConfig: {
        url: '',
        auth: {
          username: '',
          password: ''
        }
      }
    },
    game: {
      scraper: {
        defaultDatasSource: 'steam'
      },
      linkage: {
        localeEmulator: {
          path: ''
        },
        visualBoyAdvance: {
          path: ''
        },
        magpie: {
          path: '',
          hotkey: 'win+shift+a'
        }
      },
      showcase: {
        sort: {
          by: 'name',
          order: 'desc' as const
        }
      },
      gameList: {
        sort: {
          by: 'name',
          order: 'desc' as const
        },
        selectedGroup: 'all',
        highlightLocalGames: true,
        markLocalGames: false,
        showRecentGames: true
      },
      gameHeader: {
        showOriginalName: false
      }
    },
    appearances: {
      sidebar: {
        showThemeSwitcher: true
      }
    }
  } satisfies configDocs

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
    return await DBManager.getValue(this.DB_NAME, 'general', ['#all'], this.DEFAULT_VALUES.general)
  }

  /**
   * 获取同步配置
   */
  static async getSyncConfig(): Promise<configDocs['sync']> {
    return await DBManager.getValue(this.DB_NAME, 'sync', ['#all'], this.DEFAULT_VALUES.sync)
  }

  /**
   * 获取游戏配置
   */
  static async getGameConfig(): Promise<configDocs['game']> {
    return await DBManager.getValue(this.DB_NAME, 'game', ['#all'], this.DEFAULT_VALUES.game)
  }

  /**
   * 获取外观配置
   */
  static async getAppearancesConfig(): Promise<configDocs['appearances']> {
    return await DBManager.getValue(
      this.DB_NAME,
      'appearances',
      ['#all'],
      this.DEFAULT_VALUES.appearances
    )
  }

  /**
   * 更新通用配置
   */
  static async updateGeneralConfig(config: Partial<configDocs['general']>): Promise<void> {
    const currentConfig = await this.getGeneralConfig()
    await DBManager.setValue(this.DB_NAME, 'general', ['#all'], { ...currentConfig, ...config })
  }

  /**
   * 更新同步配置
   */
  static async updateSyncConfig(config: Partial<configDocs['sync']>): Promise<void> {
    const currentConfig = await this.getSyncConfig()
    await DBManager.setValue(this.DB_NAME, 'sync', ['#all'], { ...currentConfig, ...config })
  }

  /**
   * 更新游戏配置
   */
  static async updateGameConfig(config: Partial<configDocs['game']>): Promise<void> {
    const currentConfig = await this.getGameConfig()
    await DBManager.setValue(this.DB_NAME, 'game', ['#all'], { ...currentConfig, ...config })
  }

  /**
   * 更新外观配置
   */
  static async updateAppearancesConfig(config: Partial<configDocs['appearances']>): Promise<void> {
    const currentConfig = await this.getAppearancesConfig()
    await DBManager.setValue(this.DB_NAME, 'appearances', ['#all'], {
      ...currentConfig,
      ...config
    })
  }

  /**
   * 重置指定配置到默认值
   */
  static async resetConfig(docId: keyof configDocs): Promise<void> {
    await DBManager.setValue(this.DB_NAME, docId, ['#all'], this.DEFAULT_VALUES[docId])
  }

  /**
   * 重置所有配置到默认值
   */
  static async resetAllConfigs(): Promise<void> {
    const configs = Object.entries(this.DEFAULT_VALUES)
    for (const [docId, _value] of configs) {
      await this.resetConfig(docId as keyof configDocs)
    }
  }
}
