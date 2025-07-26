import { join } from 'path'
import { promises as fs } from 'fs'
import log from 'electron-log'
import type { PluginManifest } from '@appTypes/plugin'
import type { IPlugin } from '../api/types'
import semver from 'semver'

export class PluginLoader {
  public static validateManifest(manifest: any): manifest is PluginManifest {
    const requiredFields = ['id', 'name', 'version', 'main', 'vniteVersion']

    for (const field of requiredFields) {
      if (!manifest[field]) {
        log.warn(`[Plugin] Missing required field in plugin manifest: ${field}`)
        return false
      }
    }

    // Validate version format
    if (!semver.valid(manifest.version)) {
      log.warn(`[Plugin] Invalid plugin version format: ${manifest.version}`)
      return false
    }

    if (!semver.valid(manifest.vniteVersion)) {
      log.warn(`[Plugin] Invalid Vnite version format: ${manifest.vniteVersion}`)
      return false
    }

    return true
  }

  public static async loadModule(pluginPath: string, manifest: PluginManifest): Promise<IPlugin> {
    const mainPath = join(pluginPath, manifest.main)

    try {
      // Check if main file exists
      await fs.access(mainPath)

      // Dynamically load module
      const pluginModule = await this.dynamicImport(mainPath)

      // Validate plugin exports
      if (!pluginModule || typeof pluginModule !== 'object') {
        throw new Error('Plugin must export an object')
      }

      if (typeof pluginModule.activate !== 'function') {
        throw new Error('Plugin must export activate function')
      }

      return pluginModule as IPlugin
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to load plugin: ${errorMessage}`)
    }
  }

  private static async dynamicImport(modulePath: string): Promise<any> {
    try {
      // First try ES module dynamic import
      const module = await import(modulePath)
      return module.default || module
    } catch (error) {
      log.warn(`[Plugin] ES module import failed, trying CommonJS: ${error}`)

      try {
        // Fall back to CommonJS require
        delete require.cache[require.resolve(modulePath)]
        return eval('require')(modulePath)
      } catch (requireError) {
        throw new Error(`Cannot load module: ${requireError}`)
      }
    }
  }

  public static async checkDependencies(
    manifest: PluginManifest,
    installedPlugins: Map<string, any>
  ): Promise<{ missing: string[]; incompatible: string[] }> {
    const missing: string[] = []
    const incompatible: string[] = []

    if (!manifest.dependencies) {
      return { missing, incompatible }
    }

    for (const [depId, requiredVersion] of Object.entries(manifest.dependencies)) {
      const installedPlugin = installedPlugins.get(depId)

      if (!installedPlugin) {
        missing.push(`${depId}@${requiredVersion}`)
        continue
      }

      const installedVersion = installedPlugin.manifest.version
      if (!this.isVersionCompatible(installedVersion, requiredVersion)) {
        incompatible.push(
          `${depId}: required ${requiredVersion}, but installed ${installedVersion}`
        )
      }
    }

    return { missing, incompatible }
  }

  private static isVersionCompatible(installed: string, required: string): boolean {
    // Return false if input is invalid
    if (!semver.valid(installed)) {
      return false
    }

    return semver.satisfies(installed, required)
  }

  public static async preprocessPlugin(pluginPath: string): Promise<void> {
    try {
      // Check for scripts in manifest.json or package.json
      let manifestPath = join(pluginPath, 'manifest.json')
      if (
        !(await fs.access(manifestPath).then(
          () => true,
          () => false
        ))
      ) {
        manifestPath = join(pluginPath, 'package.json')
      }

      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8')
        const manifestJson = JSON.parse(manifestContent)

        if (manifestJson.scripts && manifestJson.scripts.build) {
          log.info(`[Plugin] Plugin ${manifestJson.id} contains build script`)
          // Execute build script here if needed
        }
      } catch (manifestError) {
        log.warn(`[Plugin] Failed to read plugin manifest: ${manifestError}`)
      }
    } catch (error) {
      log.warn(`[Plugin] Failed to preprocess plugin: ${error}`)
    }
  }

  public static unloadModule(modulePath: string): void {
    try {
      // Clear require cache
      delete require.cache[require.resolve(modulePath)]

      // For ES modules, we can't directly clear the cache
      // But we can log for debugging purposes
      log.debug(`[Plugin] Cleared module cache: ${modulePath}`)
    } catch (error) {
      log.warn(`[Plugin] Failed to clear module cache: ${error}`)
    }
  }

  public static async validateSecurity(
    pluginPath: string,
    manifest: PluginManifest
  ): Promise<{ safe: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check file permissions
      const stats = await fs.stat(pluginPath)
      if (!stats.isDirectory()) {
        issues.push('Plugin path is not a directory')
      }

      // Check for suspicious files
      const entries = await fs.readdir(pluginPath, { recursive: true })
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.sh']

      for (const entry of entries) {
        const entryStr = String(entry)
        if (suspiciousExtensions.some((ext) => entryStr.endsWith(ext))) {
          issues.push(`Contains suspicious file: ${entryStr}`)
        }
      }

      // Check plugin configuration validity
      if (manifest.configuration) {
        log.debug(`[Plugin] Checking plugin configuration: ${manifest.id}`)
      }
    } catch (error) {
      issues.push(`Security check failed: ${error}`)
    }

    return {
      safe: issues.length === 0,
      issues
    }
  }
}
