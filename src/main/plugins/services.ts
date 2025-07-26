import { app } from 'electron'
import { pluginManager, pluginRegistryManager, PluginUtils } from './index'
import { eventBus } from '~/core/events'
import {
  PluginConfiguration,
  PluginStatsData,
  PluginSearchResult,
  PluginSearchOptions,
  PluginInfo,
  PluginUpdateInfo,
  PluginInstallOptions
} from '@appTypes/plugin'
import log from 'electron-log'

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

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      log.info('[Plugin] Initializing plugin system...')

      await pluginManager.initialize()

      this.setupEventListeners()

      this.initialized = true
      log.info('[Plugin] Plugin system initialization complete')
    } catch (error) {
      log.error('[Plugin] Plugin system initialization failed:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    eventBus.on('plugin:enabled', (data) => {
      log.info(`[Plugin] Plugin activated: ${data.pluginId}`)
    })

    eventBus.on('plugin:disabled', (data) => {
      log.info(`[Plugin] Plugin deactivated: ${data.pluginId}`)
    })

    eventBus.on('plugin:installed', (data) => {
      log.info(`[Plugin] Plugin installed: ${data.pluginId}`)
      this.handlePluginInstalled(data.pluginId)
    })

    eventBus.on('plugin:uninstalled', (data) => {
      log.info(`[Plugin] Plugin uninstalled: ${data.pluginId}`)
    })

    eventBus.on('plugin:error', (data) => {
      log.error(`[Plugin] Plugin error: ${data.pluginId} - ${data.error}`)
    })
  }

  private async handlePluginInstalled(pluginId: string): Promise<void> {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) return

      // Record installation log
      log.info(`[Plugin] Plugin installation details:`, {
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        author: plugin.manifest.author
      })

      await pluginManager.activatePlugin(pluginId)
    } catch (error) {
      log.error(`[Plugin] Failed to handle post-installation operations: ${pluginId}`, error)
    }
  }

  public async checkPluginUpdates(): Promise<PluginUpdateInfo[]> {
    try {
      const installedPlugins = new Map() as Map<string, PluginInfo>

      // Convert plugin format
      for (const plugin of pluginManager.getAllPlugins()) {
        installedPlugins.set(plugin.manifest.id, plugin)
      }

      const updates = await pluginRegistryManager.checkUpdates(installedPlugins)

      if (updates.length > 0) {
        log.info(`[Plugin] Found ${updates.length} plugin updates available`)

        for (const update of updates) {
          log.info(
            `[Plugin] Plugin ${update.pluginId}: ${update.currentVersion} -> ${update.latestVersion}`
          )
        }
      }

      return updates
    } catch (error) {
      log.warn('[Plugin] Failed to check plugin updates:', error)
      return []
    }
  }

  public async installPlugin(source: string, options?: PluginInstallOptions): Promise<void> {
    await pluginManager.installPlugin(source, options)
  }

  public async installPluginFromFile(
    filePath: string,
    options?: { autoEnable?: boolean }
  ): Promise<void> {
    try {
      // Validate file
      const packageInfo = await PluginUtils.extractPackageInfo(filePath)
      log.info('[Plugin] Plugin package information:', {
        id: packageInfo.manifest.id,
        name: packageInfo.manifest.name,
        version: packageInfo.manifest.version,
        files: packageInfo.files.length
      })

      // Validate plugin ID
      const validation = PluginUtils.validatePluginId(packageInfo.manifest.id)
      if (!validation.valid) {
        throw new Error(`Invalid plugin ID: ${validation.error}`)
      }

      // Install plugin
      await this.installPlugin(filePath, options)

      log.info(`[Plugin] Plugin ${packageInfo.manifest.name} installed successfully`)
    } catch (error) {
      log.error('[Plugin] Failed to install plugin from file:', error)
      throw error
    }
  }

  public async uninstallPlugin(pluginId: string): Promise<void> {
    await pluginManager.uninstallPlugin(pluginId)
  }

  public async activatePlugin(pluginId: string): Promise<void> {
    await pluginManager.activatePlugin(pluginId)
  }

  public async deactivatePlugin(pluginId: string): Promise<void> {
    await pluginManager.deactivatePlugin(pluginId)
  }

  public async searchPlugins(options?: PluginSearchOptions): Promise<PluginSearchResult> {
    try {
      log.info(
        `[Plugin] Searching remote plugins: ${options?.keyword}${options?.category ? `, category: ${options.category}` : ''}`
      )

      // Build search parameters
      const searchOptions = {
        keyword: options?.keyword || '',
        category: options?.category || 'all',
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        sort: options?.sort || 'stars',
        order: options?.order || 'desc'
      }

      // Search from remote registry
      const remoteResultsData = await pluginRegistryManager.searchPlugins(searchOptions)

      // Get information about locally installed plugins to mark installed status
      const installedPlugins = pluginManager.getAllPlugins()

      // Create a map of installed plugins (using combination of ID and author as key)
      const installedPluginMap = new Map(
        installedPlugins.map((plugin) => [
          `${plugin.manifest.id}:${plugin.manifest.author || ''}`,
          plugin
        ])
      )

      // Add installed flag to remote plugins
      const plugins = remoteResultsData.plugins.map((plugin) => {
        // Check both ID and author
        const isInstalled = installedPluginMap.has(
          `${plugin.manifest.id}:${plugin.manifest.author || plugin.owner || ''}`
        )

        return {
          ...plugin,
          installed: isInstalled
        }
      })

      // Sort installed plugins to the top (while maintaining pagination)
      plugins.sort((a, b) => {
        if (a.installed !== b.installed) {
          return a.installed ? -1 : 1
        }

        // Maintain original order
        return 0
      })

      log.info(
        `[Plugin] Search completed, found ${plugins.length} remote plugins, total ${remoteResultsData.totalCount} results`
      )

      // Return result conforming to PluginSearchResult interface
      return {
        plugins,
        totalCount: remoteResultsData.totalCount,
        currentPage: remoteResultsData.currentPage,
        totalPages: remoteResultsData.totalPages
      }
    } catch (error) {
      log.error('[Plugin] Failed to search remote plugins:', error)
      // Return empty result
      return {
        plugins: [],
        totalCount: 0,
        currentPage: options?.page || 1,
        totalPages: 0
      }
    }
  }

  public getAllPlugins(): ReturnType<typeof pluginManager.getAllPlugins> {
    return pluginManager.getAllPlugins()
  }

  public getSerializablePlugins(): ReturnType<typeof pluginManager.getSerializablePlugins> {
    return pluginManager.getSerializablePlugins()
  }

  public getPlugin(pluginId: string): ReturnType<typeof pluginManager.getPlugin> {
    return pluginManager.getPlugin(pluginId)
  }

  public getSerializablePlugin(
    pluginId: string
  ): ReturnType<typeof pluginManager.getSerializablePlugin> {
    return pluginManager.getSerializablePlugin(pluginId)
  }

  public getPluginStats(): PluginStatsData {
    try {
      const plugins = pluginManager.getAllPlugins()

      return {
        total: plugins.length,
        enabled: plugins.filter((p) => p.status === 'enabled').length,
        disabled: plugins.filter((p) => p.status === 'disabled').length,
        error: plugins.filter((p) => p.status === 'error').length
      }
    } catch (error) {
      log.error('[Plugin] Failed to get plugin statistics:', error)
      throw error
    }
  }

  public async getPluginConfiguration(pluginId: string): Promise<PluginConfiguration[]> {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`Plugin does not exist: ${pluginId}`)
      }

      return plugin.manifest.configuration || []
    } catch (error) {
      log.error(`[Plugin] Failed to get plugin configuration: ${pluginId}`, error)
      throw error
    }
  }

  public async shutdown(): Promise<void> {
    try {
      log.info('[Plugin] Shutting down plugin system...')
      await pluginManager.dispose()
      this.initialized = false
      log.info('[Plugin] Plugin system has been shut down')
    } catch (error) {
      log.error('[Plugin] Failed to shut down plugin system:', error)
    }
  }
}

export const pluginService = PluginService.getInstance()

// Clean up plugin system when application exits
app.on('before-quit', async () => {
  await pluginService.shutdown()
})
