/**
 * 插件系统服务层
 *
 * 提供插件管理的高级业务逻辑和封装
 */

import { app } from 'electron'
import { pluginManager, PluginRegistryManager, PluginUtils } from './index'
import { eventBus } from '~/core/events'
import {
  PluginConfiguration,
  PluginStatsData,
  PluginSearchResult,
  PluginSearchOptions
} from '@appTypes/plugin'
import log from 'electron-log'

// 创建注册表管理器实例
const registryManager = new PluginRegistryManager()

/**
 * 插件系统服务类
 */
export class PluginService {
  private static instance: PluginService
  private initialized = false

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): PluginService {
    if (!PluginService.instance) {
      PluginService.instance = new PluginService()
    }
    return PluginService.instance
  }

  /**
   * 初始化插件系统
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      log.info('正在初始化插件系统...')

      // 初始化插件管理器
      await pluginManager.initialize()

      // 监听插件事件
      this.setupEventListeners()

      // 检查插件更新
      await this.checkPluginUpdates()

      this.initialized = true
      log.info('插件系统初始化完成')
    } catch (error) {
      log.error('插件系统初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置插件事件监听器
   */
  private setupEventListeners(): void {
    // 插件激活事件
    eventBus.on('plugin:enabled', (data) => {
      log.info(`插件已激活: ${data.pluginId}`)
    })

    // 插件停用事件
    eventBus.on('plugin:disabled', (data) => {
      log.info(`插件已停用: ${data.pluginId}`)
    })

    // 插件安装事件
    eventBus.on('plugin:installed', (data) => {
      log.info(`插件已安装: ${data.pluginId}`)
      this.handlePluginInstalled(data.pluginId)
    })

    // 插件卸载事件
    eventBus.on('plugin:uninstalled', (data) => {
      log.info(`插件已卸载: ${data.pluginId}`)
    })

    // 插件错误事件
    eventBus.on('plugin:error', (data) => {
      log.error(`插件错误: ${data.pluginId} - ${data.error}`)
    })
  }

  /**
   * 处理插件安装后的操作
   */
  private async handlePluginInstalled(pluginId: string): Promise<void> {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) return

      // 记录安装日志
      log.info(`插件安装详情:`, {
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        author: plugin.manifest.author
      })

      await pluginManager.activatePlugin(pluginId)
    } catch (error) {
      log.error(`处理插件安装后操作失败: ${pluginId}`, error)
    }
  }

  /**
   * 检查插件更新
   */
  public async checkPluginUpdates(): Promise<
    Array<{
      pluginId: string
      currentVersion: string
      latestVersion: string
      updateAvailable: boolean
    }>
  > {
    try {
      const installedPlugins = new Map()

      // 转换插件格式
      for (const plugin of pluginManager.getAllPlugins()) {
        installedPlugins.set(plugin.manifest.id, plugin)
      }

      const updates = await registryManager.checkUpdates(installedPlugins)

      if (updates.length > 0) {
        log.info(`发现 ${updates.length} 个插件有更新可用`)

        for (const update of updates) {
          if (update.updateAvailable) {
            log.info(`插件 ${update.pluginId}: ${update.currentVersion} -> ${update.latestVersion}`)
          }
        }
      }

      return updates
    } catch (error) {
      log.warn('检查插件更新失败:', error)
      return []
    }
  }

  /**
   * 安装插件
   */
  public async installPlugin(
    source: string,
    options?: { autoEnable?: boolean; onProgress?: (progress: number, message: string) => void }
  ): Promise<void> {
    try {
      log.info(`正在安装插件: ${source}`)

      await pluginManager.installPlugin(source, {
        autoEnable: options?.autoEnable ?? false,
        onProgress:
          options?.onProgress ||
          ((progress, message) => {
            log.info(`安装进度: ${progress.toFixed(1)}% - ${message}`)
          })
      })

      log.info('插件安装成功')
    } catch (error) {
      log.error('插件安装失败:', error)
      throw error
    }
  }

  /**
   * 从文件安装插件
   */
  public async installPluginFromFile(
    filePath: string,
    options?: { autoEnable?: boolean }
  ): Promise<void> {
    try {
      // 验证文件
      const packageInfo = await PluginUtils.extractPackageInfo(filePath)
      log.info('插件包信息:', {
        id: packageInfo.manifest.id,
        name: packageInfo.manifest.name,
        version: packageInfo.manifest.version,
        files: packageInfo.files.length
      })

      // 验证插件ID
      const validation = PluginUtils.validatePluginId(packageInfo.manifest.id)
      if (!validation.valid) {
        throw new Error(`插件ID无效: ${validation.error}`)
      }

      // 安装插件
      await this.installPlugin(filePath, options)

      log.info(`插件 ${packageInfo.manifest.name} 安装成功`)
    } catch (error) {
      log.error('从文件安装插件失败:', error)
      throw error
    }
  }

  /**
   * 卸载插件
   */
  public async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      log.info(`正在卸载插件: ${pluginId}`)
      await pluginManager.uninstallPlugin(pluginId)
      log.info(`插件 ${pluginId} 卸载成功`)
    } catch (error) {
      log.error(`卸载插件失败: ${pluginId}`, error)
      throw error
    }
  }

  /**
   * 激活插件
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    try {
      await pluginManager.activatePlugin(pluginId)
    } catch (error) {
      log.error(`激活插件失败: ${pluginId}`, error)
      throw error
    }
  }

  /**
   * 停用插件
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    try {
      await pluginManager.deactivatePlugin(pluginId)
    } catch (error) {
      log.error(`停用插件失败: ${pluginId}`, error)
      throw error
    }
  }

  /**
   * 搜索远程插件并标记已安装状态
   */
  public async searchPlugins(options?: PluginSearchOptions): Promise<PluginSearchResult> {
    try {
      log.info(
        `搜索远程插件: ${options?.keyword}${options?.category ? `, 分类: ${options.category}` : ''}`
      )

      // 构建搜索参数
      const searchOptions = {
        keyword: options?.keyword || '',
        category: options?.category || 'all',
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        sort: options?.sort || 'stars',
        order: options?.order || 'desc'
      }

      // 从远程注册表搜索
      const remoteResultsData = await registryManager.searchPlugins(searchOptions)

      // 获取本地已安装插件的信息，用于标记已安装状态
      const installedPlugins = pluginManager.getAllPlugins()

      // 创建已安装插件的标识映射 (使用 ID 和作者的组合作为键)
      const installedPluginMap = new Map(
        installedPlugins.map((plugin) => [
          `${plugin.manifest.id}:${plugin.manifest.author || ''}`,
          plugin
        ])
      )

      // 为远程插件添加已安装标记
      const plugins = remoteResultsData.plugins.map((plugin) => {
        // 同时检查 ID 和作者
        const isInstalled = installedPluginMap.has(
          `${plugin.manifest.id}:${plugin.manifest.author || plugin.owner || ''}`
        )

        return {
          ...plugin,
          installed: isInstalled
        }
      })

      // 将已安装的插件排在前面（保持分页的基础上）
      plugins.sort((a, b) => {
        if (a.installed !== b.installed) {
          return a.installed ? -1 : 1
        }

        // 保持原有排序
        return 0
      })

      log.info(
        `搜索完成，找到 ${plugins.length} 个远程插件，总计 ${remoteResultsData.totalCount} 个结果`
      )

      // 返回符合 PluginSearchResult 接口的结果
      return {
        plugins,
        totalCount: remoteResultsData.totalCount,
        currentPage: remoteResultsData.currentPage,
        totalPages: remoteResultsData.totalPages
      }
    } catch (error) {
      log.error('搜索远程插件失败:', error)
      // 返回空结果
      return {
        plugins: [],
        totalCount: 0,
        currentPage: options?.page || 1,
        totalPages: 0
      }
    }
  }

  /**
   * 获取所有插件
   */
  public getAllPlugins(): ReturnType<typeof pluginManager.getAllPlugins> {
    return pluginManager.getAllPlugins()
  }

  /**
   * 获取序列化的插件数据（用于IPC通信）
   */
  public getSerializablePlugins(): ReturnType<typeof pluginManager.getSerializablePlugins> {
    return pluginManager.getSerializablePlugins()
  }

  /**
   * 获取插件详情
   */
  public getPlugin(pluginId: string): ReturnType<typeof pluginManager.getPlugin> {
    return pluginManager.getPlugin(pluginId)
  }

  /**
   * 获取序列化的插件详情（用于IPC通信）
   */
  public getSerializablePlugin(
    pluginId: string
  ): ReturnType<typeof pluginManager.getSerializablePlugin> {
    return pluginManager.getSerializablePlugin(pluginId)
  }

  /**
   * 获取插件统计信息
   */
  public getPluginStats(): PluginStatsData {
    const plugins = pluginManager.getAllPlugins()

    return {
      total: plugins.length,
      enabled: plugins.filter((p) => p.status === 'enabled').length,
      disabled: plugins.filter((p) => p.status === 'disabled').length,
      error: plugins.filter((p) => p.status === 'error').length
    }
  }

  /**
   * 获取插件配置项定义
   */
  public async getPluginConfiguration(pluginId: string): Promise<PluginConfiguration[]> {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      return plugin.manifest.configuration || []
    } catch (error) {
      log.error(`获取插件配置项失败: ${pluginId}`, error)
      throw error
    }
  }

  /**
   * 关闭插件系统
   */
  public async shutdown(): Promise<void> {
    try {
      log.info('正在关闭插件系统...')
      await pluginManager.dispose()
      this.initialized = false
      log.info('插件系统已关闭')
    } catch (error) {
      log.error('关闭插件系统失败:', error)
    }
  }
}

// 导出服务实例
export const pluginService = PluginService.getInstance()

// 应用退出时清理插件系统
app.on('before-quit', async () => {
  await pluginService.shutdown()
})
