/**
 * 插件系统 IPC 通信
 *
 * 处理渲染进程与主进程之间的插件相关通信
 */

import { ipcManager } from '~/core/ipc'
import { pluginService } from './services'
import log from 'electron-log'
import { PluginInstallOptions, PluginSearchOptions } from '@appTypes/plugin'

/**
 * 设置插件系统相关的IPC处理器
 */
export function setupPluginIPC(): void {
  // 初始化插件系统
  ipcManager.handle('plugin:initialize', async () => {
    try {
      await pluginService.initialize()
      return { success: true }
    } catch (error) {
      log.error('初始化插件系统失败:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 获取所有插件
  ipcManager.handle('plugin:get-all-plugins', async () => {
    try {
      return pluginService.getSerializablePlugins()
    } catch (error) {
      log.error('获取所有插件失败:', error)
      throw error
    }
  })

  // 获取特定插件
  ipcManager.handle('plugin:get-plugin', async (_, pluginId: string) => {
    try {
      return pluginService.getSerializablePlugin(pluginId)
    } catch (error) {
      log.error(`获取插件失败: ${pluginId}`, error)
      throw error
    }
  })

  // 搜索插件
  ipcManager.handle('plugin:search-plugins', async (_, keyword: PluginSearchOptions) => {
    try {
      return await pluginService.searchPlugins(keyword)
    } catch (error) {
      log.error(`搜索插件失败: ${keyword}`, error)
      throw error
    }
  })

  // 安装插件
  ipcManager.handle(
    'plugin:install-plugin',
    async (_, source: string, options?: PluginInstallOptions) => {
      try {
        await pluginService.installPlugin(source, options)
        return { success: true }
      } catch (error) {
        log.error(`安装插件失败: ${source}`, error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  // 从文件安装插件
  ipcManager.handle(
    'plugin:install-plugin-from-file',
    async (_, filePath: string, options?: { autoEnable?: boolean }) => {
      try {
        await pluginService.installPluginFromFile(filePath, options)
        return { success: true }
      } catch (error) {
        log.error(`从文件安装插件失败: ${filePath}`, error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  // 卸载插件
  ipcManager.handle('plugin:uninstall-plugin', async (_, pluginId: string) => {
    try {
      await pluginService.uninstallPlugin(pluginId)
      return { success: true }
    } catch (error) {
      log.error(`卸载插件失败: ${pluginId}`, error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 激活插件
  ipcManager.handle('plugin:activate-plugin', async (_, pluginId: string) => {
    try {
      await pluginService.activatePlugin(pluginId)
      return { success: true }
    } catch (error) {
      log.error(`激活插件失败: ${pluginId}`, error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 停用插件
  ipcManager.handle('plugin:deactivate-plugin', async (_, pluginId: string) => {
    try {
      await pluginService.deactivatePlugin(pluginId)
      return { success: true }
    } catch (error) {
      log.error(`停用插件失败: ${pluginId}`, error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 检查插件更新
  ipcManager.handle('plugin:check-updates', async () => {
    try {
      return await pluginService.checkPluginUpdates()
    } catch (error) {
      log.error('检查插件更新失败:', error)
      throw error
    }
  })

  // 获取插件统计信息
  ipcManager.handle('plugin:get-stats', async () => {
    try {
      return pluginService.getPluginStats()
    } catch (error) {
      log.error('获取插件统计信息失败:', error)
      throw error
    }
  })

  // 获取插件配置项
  ipcManager.handle('plugin:get-plugin-configuration', async (_, pluginId: string) => {
    try {
      return await pluginService.getPluginConfiguration(pluginId)
    } catch (error) {
      log.error(`获取插件配置项失败: ${pluginId}`, error)
      throw error
    }
  })

  // 关闭插件系统
  ipcManager.handle('plugin:shutdown', async () => {
    try {
      await pluginService.shutdown()
      return { success: true }
    } catch (error) {
      log.error('关闭插件系统失败:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  log.info('插件系统 IPC 处理器已设置完成')
}
