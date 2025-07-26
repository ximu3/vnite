import { join, dirname } from 'path'
import { promises as fs } from 'fs'
import AdmZip from 'adm-zip'
import { net } from 'electron'
import { VnitePluginAPI } from '../api'
import { PluginDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import log from 'electron-log/main'
import type {
  PluginManifest,
  PluginInfo,
  PluginInstallOptions,
  PluginSearchOptions
} from '@appTypes/plugin'
import { IPlugin } from '../api/types'
import { PluginStatus, PluginStatsData } from '@appTypes/plugin'
import { ipcManager } from '~/core/ipc'
import { getPluginPath } from '~/features/system'

export class PluginManager {
  private static instance: PluginManager
  private plugins: Map<string, PluginInfo> = new Map()
  private pluginsDir: string = '' // Initialized in initialize() calling form main process initialization
  private loadedModules: Map<string, any> = new Map()

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager()
    }
    return PluginManager.instance
  }

  public async initialize(): Promise<void> {
    try {
      this.pluginsDir = getPluginPath()
      // Ensure plugins directory exists
      await fs.mkdir(this.pluginsDir, { recursive: true })

      // Load all installed plugins
      await this.discoverPlugins()

      // Enable plugins that are installed and set to enabled
      await this.loadEnabledPlugins()

      log.info('[Plugin] Plugin manager initialization completed')
      // Can choose to send system startup complete event or remove this event
    } catch (error) {
      log.error('[Plugin] Plugin manager initialization failed:', error)
      throw error
    }
  }

  private async discoverPlugins(): Promise<void> {
    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPluginInfo(entry.name)
        }
      }

      log.info(`[Plugin] Discovered ${this.plugins.size} installed plugins`)
    } catch (error) {
      log.error('[Plugin] Failed to discover plugins:', error)
    }
  }

  private async loadPluginInfo(pluginId: string): Promise<void> {
    try {
      const pluginDir = join(this.pluginsDir, pluginId)

      // Look for manifest.json first, then package.json
      let manifestPath = join(pluginDir, 'manifest.json')
      if (
        !(await fs.access(manifestPath).then(
          () => true,
          () => false
        ))
      ) {
        manifestPath = join(pluginDir, 'package.json')
      }

      // Check if manifest file exists
      try {
        await fs.access(manifestPath)
      } catch {
        log.warn(`[Plugin] Plugin ${pluginId} is missing manifest.json or package.json file`)
        return
      }

      // Read manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifest: PluginManifest = JSON.parse(manifestContent)

      // Validate manifest
      if (!this.validateManifest(manifest)) {
        log.warn(`[Plugin] Plugin ${pluginId} has an invalid manifest.json/package.json format`)
        return
      }

      const pluginInfo: PluginInfo = {
        manifest,
        status: PluginStatus.DISABLED,
        installPath: pluginDir,
        installTime: new Date(),
        lastUpdateTime: new Date()
      }

      this.plugins.set(pluginId, pluginInfo)

      ipcManager.send('plugin:update-all-plugins', this.getSerializablePlugins())
      ipcManager.send('plugin:update-plugin-stats', this.getPluginStats())

      log.info(`[Plugin] Loaded plugin info: ${pluginId}`)
    } catch (error) {
      log.error(`[Plugin] Failed to load plugin ${pluginId} info:`, error)
    }
  }

  public getPluginStats(): PluginStatsData {
    const plugins = this.getAllPlugins()

    return {
      total: plugins.length,
      enabled: plugins.filter((p) => p.status === 'enabled').length,
      disabled: plugins.filter((p) => p.status === 'disabled').length,
      error: plugins.filter((p) => p.status === 'error').length
    }
  }

  private validateManifest(manifest: any): manifest is PluginManifest {
    return !!(
      manifest.id &&
      manifest.name &&
      manifest.version &&
      manifest.main &&
      manifest.vniteVersion
    )
  }

  private async loadEnabledPlugins(): Promise<void> {
    // Get all registered plugin IDs
    const pluginIds = Array.from(this.plugins.keys())

    // Iterate through all plugins, check enabled status in database
    for (const pluginId of pluginIds) {
      // Get plugin enabled status from database, default to false
      const isEnabled = await PluginDBManager.getPluginValue(
        'system',
        `plugins.${pluginId}.enabled`,
        false
      )

      // If the plugin is marked as enabled in the database, activate it
      if (isEnabled) {
        await this.activatePlugin(pluginId)
      }
    }
  }

  public async activatePlugin(pluginId: string): Promise<void> {
    try {
      const pluginInfo = this.plugins.get(pluginId)
      if (!pluginInfo) {
        throw new Error(`Plugin ${pluginId} does not exist`)
      }

      if (pluginInfo.status === PluginStatus.ENABLED) {
        log.warn(`[Plugin] Plugin ${pluginId} is already enabled`)
        return
      }

      // Set status to loading
      this.updatePluginStatus(pluginId, PluginStatus.LOADING)

      // Load plugin module
      const pluginModule = await this.loadPluginModule(pluginInfo)

      // Create API instance
      const api = new VnitePluginAPI(pluginId)

      // Activate plugin
      if (pluginModule.activate) {
        await pluginModule.activate(api)
      }

      // Save plugin instance
      pluginInfo.instance = pluginModule
      this.loadedModules.set(pluginId, pluginModule)

      // Update status
      this.updatePluginStatus(pluginId, PluginStatus.ENABLED)
      await PluginDBManager.setPluginValue('system', `plugins.${pluginId}.enabled`, true)

      log.info(`[Plugin] Plugin ${pluginId} activated successfully`)
      eventBus.emit('plugin:enabled', { pluginId }, { source: 'PluginManager' })
    } catch (error) {
      log.error(`[Plugin] Failed to activate plugin ${pluginId}:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.updatePluginStatus(pluginId, PluginStatus.ERROR, errorMessage)
      throw error
    }
  }

  public async deactivatePlugin(pluginId: string, onQuit = false): Promise<void> {
    try {
      const pluginInfo = this.plugins.get(pluginId)
      if (!pluginInfo) {
        throw new Error(`Plugin ${pluginId} does not exist`)
      }

      if (pluginInfo.status !== PluginStatus.ENABLED) {
        log.warn(`[Plugin] Plugin ${pluginId} is not enabled`)
        return
      }

      const pluginModule = this.loadedModules.get(pluginId)
      if (pluginModule && pluginModule.deactivate) {
        // Create API instance for deactivate to use
        const api = new VnitePluginAPI(pluginId)
        await pluginModule.deactivate(api)
      }

      // Clear module cache
      this.loadedModules.delete(pluginId)
      pluginInfo.instance = undefined

      // Update status
      this.updatePluginStatus(pluginId, PluginStatus.DISABLED)
      !onQuit &&
        (await PluginDBManager.setPluginValue('system', `plugins.${pluginId}.enabled`, false))

      log.info(`[Plugin] Plugin ${pluginId} deactivated successfully`)
      eventBus.emit('plugin:disabled', { pluginId }, { source: 'PluginManager' })
    } catch (error) {
      log.error(`[Plugin] Failed to deactivate plugin ${pluginId}:`, error)
      throw error
    }
  }

  private async loadPluginModule(pluginInfo: PluginInfo): Promise<IPlugin> {
    const mainPath = join(pluginInfo.installPath, pluginInfo.manifest.main)

    try {
      // Dynamically import module (supports ESM and CJS)
      let pluginModule: any
      try {
        // Try using dynamic import
        pluginModule = await import(mainPath)
      } catch {
        // Fall back to require
        delete require.cache[require.resolve(mainPath)]
        // eslint-disable-next-line
        pluginModule = require(mainPath)
      }

      // Support both ES modules and CommonJS modules
      const plugin = pluginModule.default || pluginModule

      if (!plugin) {
        throw new Error('Plugin module did not export valid content')
      }

      return plugin
    } catch (error) {
      log.error(`[Plugin] Failed to load plugin module: ${mainPath}`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Unable to load plugin module: ${errorMessage}`)
    }
  }

  public async installPlugin(
    source: string | Buffer,
    options: PluginInstallOptions = {}
  ): Promise<void> {
    try {
      let pluginBuffer: Buffer

      if (typeof source === 'string') {
        // Download from URL
        if (source.startsWith('http')) {
          pluginBuffer = await this.downloadPlugin(source)
        } else {
          // Read from local file
          pluginBuffer = await fs.readFile(source)
        }
      } else {
        pluginBuffer = source
      }

      // Extract and install
      await this.extractAndInstallPlugin(pluginBuffer, options)
    } catch (error) {
      log.error('[Plugin] Failed to install plugin:', error)
      throw error
    }
  }

  private async downloadPlugin(url: string): Promise<Buffer> {
    try {
      const response = await net.fetch(url)

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Unable to read response stream')
      }

      // Prepare array to receive data
      const chunks: Uint8Array[] = []
      let receivedLength = 0

      // Read data stream
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        chunks.push(value)
        receivedLength += value.length
      }

      // Combine all received data chunks
      const allChunks = new Uint8Array(receivedLength)
      let position = 0
      for (const chunk of chunks) {
        allChunks.set(chunk, position)
        position += chunk.length
      }

      // Convert to Buffer and return
      return Buffer.from(allChunks)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to download plugin: ${errorMessage}`)
    }
  }

  private async extractAndInstallPlugin(
    buffer: Buffer,
    options: PluginInstallOptions
  ): Promise<void> {
    try {
      const zip = new AdmZip(buffer)
      const entries = zip.getEntries()

      // Debug: List all entries
      log.info(`[Plugin] Plugin package contents (${entries.length} entries):`)
      entries.forEach((entry, index) => {
        log.debug(
          `  ${index + 1}. ${entry.entryName} ${entry.isDirectory ? '(directory)' : `(file, ${entry.header.size} bytes)`}`
        )
      })

      // Find manifest file (supports manifest.json or package.json)
      const manifestEntry = entries.find(
        (entry) =>
          (entry.entryName.endsWith('manifest.json') || entry.entryName.endsWith('package.json')) &&
          !entry.entryName.includes('node_modules')
      )

      if (!manifestEntry) {
        throw new Error('No manifest.json or package.json file found in plugin package')
      }

      // Parse manifest
      const manifestContent = manifestEntry.getData().toString('utf8')
      const manifest: PluginManifest = JSON.parse(manifestContent)

      if (!this.validateManifest(manifest)) {
        throw new Error('Plugin manifest.json/package.json format is invalid')
      }

      // Check if already installed
      if (this.plugins.has(manifest.id) && !options.overwrite) {
        throw new Error(
          `Plugin ${manifest.id} is already installed, use overwrite option to force replace`
        )
      }

      // Installation directory
      const installDir = join(this.pluginsDir, manifest.id)

      // If it already exists, delete it first
      try {
        await fs.rm(installDir, { recursive: true, force: true })
      } catch {
        // Ignore deletion errors
      }

      // Create installation directory
      await fs.mkdir(installDir, { recursive: true })

      // Extract files
      const rootDir = dirname(manifestEntry.entryName)
      log.info(
        `[Plugin] Extracting plugin, root directory: "${rootDir}", total entries: ${entries.length}`
      )

      let extractedFiles = 0
      for (const entry of entries) {
        // Skip directories
        if (entry.isDirectory) {
          log.debug(`[Plugin] Skipping directory: ${entry.entryName}`)
          continue
        }

        let relativePath: string

        if (rootDir === '.') {
          // Manifest in root directory case
          relativePath = entry.entryName
        } else {
          // Manifest in subdirectory case
          if (!entry.entryName.startsWith(rootDir)) {
            log.debug(`[Plugin] Skipping file not in root directory: ${entry.entryName}`)
            continue
          }
          relativePath = entry.entryName.substring(rootDir.length + 1)
        }

        // Skip empty relative paths
        if (!relativePath) {
          log.debug(`[Plugin] Skipping empty relative path: ${entry.entryName}`)
          continue
        }

        const targetPath = join(installDir, relativePath)
        log.debug(`[Plugin] Preparing to extract: ${entry.entryName} -> ${targetPath}`)

        try {
          // Ensure target directory exists
          await fs.mkdir(dirname(targetPath), { recursive: true })

          // Write file - convert to Uint8Array
          const fileData = new Uint8Array(entry.getData())
          await fs.writeFile(targetPath, fileData)

          extractedFiles++
          log.debug(
            `[Plugin] Extracted file ${extractedFiles}: ${relativePath} (${fileData.length} bytes)`
          )
        } catch (error) {
          log.error(`[Plugin] Failed to extract file ${relativePath}:`, error)
          throw error
        }
      }

      log.info(`[Plugin] Successfully extracted ${extractedFiles} files to ${installDir}`)

      // Load plugin info
      await this.loadPluginInfo(manifest.id)

      // Auto-enable
      if (options.autoEnable) {
        await this.activatePlugin(manifest.id)
      }

      log.info(`[Plugin] Plugin ${manifest.id} installed successfully`)
      eventBus.emit(
        'plugin:installed',
        { pluginId: manifest.id, activate: !!options.autoEnable },
        { source: 'PluginManager' }
      )

      options.onProgress?.(100, 'Installation complete')
    } catch (error) {
      log.error('[Plugin] Failed to extract and install plugin:', error)
      throw error
    }
  }

  public async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      const pluginInfo = this.plugins.get(pluginId)
      if (!pluginInfo) {
        throw new Error(`Plugin ${pluginId} does not exist`)
      }

      // If plugin is enabled, deactivate it first
      if (pluginInfo.status === PluginStatus.ENABLED) {
        await this.deactivatePlugin(pluginId)
      }

      // Delete plugin files
      await fs.rm(pluginInfo.installPath, { recursive: true, force: true })

      // Remove from memory
      this.plugins.delete(pluginId)
      this.loadedModules.delete(pluginId)

      // Clean up plugin data
      await PluginDBManager.removePlugin(pluginId)

      ipcManager.send('plugin:update-all-plugins', this.getSerializablePlugins())
      ipcManager.send('plugin:update-plugin-stats', this.getPluginStats())

      log.info(`[Plugin] Plugin ${pluginId} uninstalled successfully`)
      eventBus.emit(
        'plugin:uninstalled',
        { pluginId, removeData: false },
        { source: 'PluginManager' }
      )
    } catch (error) {
      log.error(`[Plugin] Failed to uninstall plugin ${pluginId}:`, error)
      throw error
    }
  }

  public searchPlugins(options: PluginSearchOptions = {}): PluginInfo[] {
    let results = Array.from(this.plugins.values())

    // Filter by keyword
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase()
      results = results.filter(
        (plugin) =>
          plugin.manifest.name.toLowerCase().includes(keyword) ||
          plugin.manifest.description.toLowerCase().includes(keyword) ||
          (plugin.manifest.author || '').toLowerCase().includes(keyword) ||
          plugin.manifest.keywords?.some((k) => k.toLowerCase().includes(keyword))
      )
    }

    // Filter by category
    if (options.category && options.category !== 'all') {
      results = results.filter((plugin) => plugin.manifest.category === options.category)
    }

    // Filter by status
    if (options.status) {
      results = results.filter((plugin) => plugin.status === options.status)
    }

    // Sort
    if (options.sort) {
      const { sort, order = 'asc' } = options

      results.sort((a, b) => {
        let comparison = 0
        switch (sort) {
          case 'name':
            comparison = a.manifest.name.localeCompare(b.manifest.name)
            break
          case 'status':
            comparison = a.status.localeCompare(b.status)
            break
          case 'category':
            comparison = (a.manifest.category || '').localeCompare(b.manifest.category || '')
            break
          case 'author':
            comparison = (a.manifest.author || '').localeCompare(b.manifest.author || '')
            break
          case 'date':
            comparison = new Date(a.installTime).getTime() - new Date(b.installTime).getTime()
            break
          default:
            comparison = a.manifest.name.localeCompare(b.manifest.name)
        }

        // Apply sort order
        return order === 'asc' ? comparison : -comparison
      })
    }

    return results
  }

  public getPlugin(pluginId: string): PluginInfo | undefined {
    return this.plugins.get(pluginId)
  }

  public getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values())
  }

  public getSerializablePlugins(): Omit<PluginInfo, 'instance'>[] {
    try {
      return Array.from(this.plugins.values()).map((plugin) => ({
        manifest: plugin.manifest,
        status: plugin.status,
        installPath: plugin.installPath,
        installTime: plugin.installTime,
        lastUpdateTime: plugin.lastUpdateTime,
        error: plugin.error
      }))
    } catch (error) {
      log.error('[Plugin] Failed to get serializable plugins:', error)
      throw error
    }
  }

  public getSerializablePlugin(pluginId: string): Omit<PluginInfo, 'instance'> | undefined {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return undefined

    return {
      manifest: plugin.manifest,
      status: plugin.status,
      installPath: plugin.installPath,
      installTime: plugin.installTime,
      lastUpdateTime: plugin.lastUpdateTime,
      error: plugin.error
    }
  }

  private updatePluginStatus(pluginId: string, status: PluginStatus, error?: string): void {
    const pluginInfo = this.plugins.get(pluginId)
    if (pluginInfo) {
      pluginInfo.status = status
      if (error) {
        pluginInfo.error = error
        // Send plugin error event
        eventBus.emit(
          'plugin:error',
          {
            pluginId,
            error,
            context: 'status update',
            canRecover: true
          },
          { source: 'PluginManager' }
        )
      } else {
        delete pluginInfo.error
      }
      ipcManager.send('plugin:update-all-plugins', this.getSerializablePlugins())
      ipcManager.send('plugin:update-plugin-stats', this.getPluginStats())
    }
  }

  public async dispose(): Promise<void> {
    // Deactivate all plugins
    const enabledPlugins = Array.from(this.plugins.values()).filter(
      (plugin) => plugin.status === PluginStatus.ENABLED
    )

    for (const plugin of enabledPlugins) {
      try {
        await this.deactivatePlugin(plugin.manifest.id, true)
      } catch (error) {
        log.error(`[Plugin] Failed to deactivate plugin ${plugin.manifest.id}:`, error)
      }
    }

    this.plugins.clear()
    this.loadedModules.clear()
  }
}

export const pluginManager = PluginManager.getInstance()
