/**
 * 插件加载器
 *
 * 负责处理插件的动态加载和模块解析
 */

import { join } from 'path'
import { promises as fs } from 'fs'
import log from 'electron-log'
import type { PluginManifest } from '@appTypes/plugin'
import type { IPlugin } from '../api/types'

export class PluginLoader {
  /**
   * 验证插件manifest文件
   */
  public static validateManifest(manifest: any): manifest is PluginManifest {
    const requiredFields = ['id', 'name', 'version', 'main', 'vniteVersion']

    for (const field of requiredFields) {
      if (!manifest[field]) {
        log.warn(`插件manifest缺少必要字段: ${field}`)
        return false
      }
    }

    // 验证版本格式
    if (!this.isValidVersion(manifest.version)) {
      log.warn(`插件版本格式不正确: ${manifest.version}`)
      return false
    }

    if (!this.isValidVersion(manifest.vniteVersion)) {
      log.warn(`Vnite版本格式不正确: ${manifest.vniteVersion}`)
      return false
    }

    return true
  }

  /**
   * 验证版本格式
   */
  private static isValidVersion(version: string): boolean {
    // 简单的语义版本验证
    const versionRegex = /^\d+\.\d+\.\d+(-[\w\d.-]+)?(\+[\w\d.-]+)?$/
    return versionRegex.test(version)
  }

  /**
   * 加载插件模块
   */
  public static async loadModule(pluginPath: string, manifest: PluginManifest): Promise<IPlugin> {
    const mainPath = join(pluginPath, manifest.main)

    try {
      // 检查主文件是否存在
      await fs.access(mainPath)

      // 动态加载模块
      const pluginModule = await this.dynamicImport(mainPath)

      // 验证插件导出
      if (!pluginModule || typeof pluginModule !== 'object') {
        throw new Error('插件必须导出一个对象')
      }

      if (typeof pluginModule.activate !== 'function') {
        throw new Error('插件必须导出activate函数')
      }

      return pluginModule as IPlugin
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`加载插件失败: ${errorMessage}`)
    }
  }

  /**
   * 动态导入模块
   */
  private static async dynamicImport(modulePath: string): Promise<any> {
    try {
      // 首先尝试ES模块动态导入
      const module = await import(modulePath)
      return module.default || module
    } catch (error) {
      log.warn(`ES模块导入失败，尝试CommonJS: ${error}`)

      try {
        // 回退到CommonJS require
        delete require.cache[require.resolve(modulePath)]
        return eval('require')(modulePath)
      } catch (requireError) {
        throw new Error(`无法加载模块: ${requireError}`)
      }
    }
  }

  /**
   * 检查插件依赖
   */
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
        incompatible.push(`${depId}: 需要 ${requiredVersion}, 但已安装 ${installedVersion}`)
      }
    }

    return { missing, incompatible }
  }

  /**
   * 检查版本兼容性
   */
  private static isVersionCompatible(installed: string, required: string): boolean {
    // 简单的版本兼容性检查
    // 实际项目中应该使用更完善的semver库

    if (required.startsWith('^')) {
      // 兼容主版本
      const requiredMajor = required.substring(1).split('.')[0]
      const installedMajor = installed.split('.')[0]
      return requiredMajor === installedMajor
    }

    if (required.startsWith('~')) {
      // 兼容次版本
      const requiredMinor = required.substring(1).split('.').slice(0, 2).join('.')
      const installedMinor = installed.split('.').slice(0, 2).join('.')
      return requiredMinor === installedMinor
    }

    // 精确匹配
    return installed === required
  }

  /**
   * 预处理插件代码
   */
  public static async preprocessPlugin(pluginPath: string): Promise<void> {
    try {
      // 检查是否需要TypeScript编译
      const tsConfigPath = join(pluginPath, 'tsconfig.json')

      try {
        await fs.access(tsConfigPath)
        // 如果存在tsconfig.json，可以在这里添加TypeScript编译逻辑
        log.info(`发现TypeScript配置: ${tsConfigPath}`)
      } catch {
        // 没有TypeScript配置，跳过
      }

      // 检查manifest.json或package.json中的scripts
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
          log.info(`插件 ${manifestJson.id} 包含构建脚本`)
          // 这里可以执行构建脚本
        }
      } catch (manifestError) {
        log.warn(`读取插件清单失败: ${manifestError}`)
      }
    } catch (error) {
      log.warn(`预处理插件失败: ${error}`)
    }
  }

  /**
   * 卸载模块缓存
   */
  public static unloadModule(modulePath: string): void {
    try {
      // 清除require缓存
      delete require.cache[require.resolve(modulePath)]

      // 对于ES模块，我们无法直接清除缓存
      // 但可以记录日志以便调试
      log.debug(`已清除模块缓存: ${modulePath}`)
    } catch (error) {
      log.warn(`清除模块缓存失败: ${error}`)
    }
  }

  /**
   * 验证插件安全性
   */
  public static async validateSecurity(
    pluginPath: string,
    manifest: PluginManifest
  ): Promise<{ safe: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // 检查文件权限
      const stats = await fs.stat(pluginPath)
      if (!stats.isDirectory()) {
        issues.push('插件路径不是目录')
      }

      // 检查是否包含可疑文件
      const entries = await fs.readdir(pluginPath, { recursive: true })
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.sh']

      for (const entry of entries) {
        const entryStr = String(entry)
        if (suspiciousExtensions.some((ext) => entryStr.endsWith(ext))) {
          issues.push(`包含可疑文件: ${entryStr}`)
        }
      }

      // 检查插件配置的合法性
      if (manifest.configuration) {
        log.debug(`检查插件配置: ${manifest.id}`)
      }
    } catch (error) {
      issues.push(`安全检查失败: ${error}`)
    }

    return {
      safe: issues.length === 0,
      issues
    }
  }
}
