/**
 * 插件系统入口文件
 *
 * 导出所有插件管理相关的类和实例
 */

// 管理器
export { PluginManager, pluginManager } from './manager/PluginManager'

// 加载器
export { PluginLoader } from './loader/PluginLoader'

// 注册表
export { PluginRegistryManager } from './registry/PluginRegistryManager'

// 工具
export { PluginUtils } from './utils/PluginUtils'

// API
export { VnitePluginAPI } from './api'

// 服务
export { PluginService, pluginService } from './services'

// IPC
export { setupPluginIPC } from './ipc'
