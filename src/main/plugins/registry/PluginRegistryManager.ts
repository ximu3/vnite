/**
 * 插件注册表管理器
 *
 * 负责管理插件注册表，处理插件的搜索、下载等功能
 */

import axios from 'axios'
import log from 'electron-log'
import type { PluginRegistry, PluginPackage, PluginManifest } from '@appTypes/plugin'

export class PluginRegistryManager {
  private registries: Map<string, PluginRegistry> = new Map()

  constructor() {
    this.initializeDefaultRegistries()
  }

  /**
   * 初始化默认注册表
   */
  private initializeDefaultRegistries(): void {
    const defaultRegistries: PluginRegistry[] = [
      {
        name: 'Vnite Official Registry',
        url: 'https://plugins.vnite.app/registry',
        enabled: false
      },
      {
        name: 'GitHub Registry',
        url: 'https://api.github.com/search/repositories',
        enabled: false
      }
    ]

    for (const registry of defaultRegistries) {
      this.registries.set(registry.url, registry)
    }
  }

  /**
   * 添加注册表
   */
  public addRegistry(registry: PluginRegistry): void {
    this.registries.set(registry.url, registry)
    log.info(`已添加插件注册表: ${registry.name}`)
  }

  /**
   * 删除注册表
   */
  public removeRegistry(url: string): boolean {
    const success = this.registries.delete(url)
    if (success) {
      log.info(`已删除插件注册表: ${url}`)
    }
    return success
  }

  /**
   * 启用/禁用注册表
   */
  public toggleRegistry(url: string, enabled: boolean): boolean {
    const registry = this.registries.get(url)
    if (registry) {
      registry.enabled = enabled
      log.info(`${enabled ? '启用' : '禁用'}注册表: ${registry.name}`)
      return true
    }
    return false
  }

  /**
   * 获取所有注册表
   */
  public getAllRegistries(): PluginRegistry[] {
    return Array.from(this.registries.values())
  }

  /**
   * 获取已启用的注册表
   */
  public getEnabledRegistries(): PluginRegistry[] {
    return Array.from(this.registries.values()).filter((r) => r.enabled)
  }

  /**
   * 搜索插件
   */
  public async searchPlugins(
    keyword: string,
    options?: {
      category?: string
      limit?: number
      timeout?: number
    }
  ): Promise<PluginPackage[]> {
    const results: PluginPackage[] = []
    const enabledRegistries = this.getEnabledRegistries()

    const searchPromises = enabledRegistries.map(async (registry) => {
      try {
        const packages = await this.searchInRegistry(registry, keyword, options)
        results.push(...packages)
      } catch (error) {
        log.warn(`从注册表 ${registry.name} 搜索失败:`, error)
      }
    })

    await Promise.allSettled(searchPromises)

    // 去重并排序
    return this.deduplicateAndSort(results, keyword)
  }

  /**
   * 在单个注册表中搜索
   */
  private async searchInRegistry(
    registry: PluginRegistry,
    keyword: string,
    options?: {
      category?: string
      limit?: number
      timeout?: number
    }
  ): Promise<PluginPackage[]> {
    const timeout = options?.timeout || 5000
    const limit = options?.limit || 50

    try {
      if (registry.url.includes('github.com')) {
        return await this.searchGitHub(keyword, limit, timeout)
      } else {
        return await this.searchOfficialRegistry(registry, keyword, options)
      }
    } catch (error) {
      log.error(`注册表搜索失败 ${registry.name}:`, error)
      throw error
    }
  }

  /**
   * 搜索GitHub
   */
  private async searchGitHub(
    keyword: string,
    limit: number,
    timeout: number
  ): Promise<PluginPackage[]> {
    const response = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: `${keyword} vnite plugin`,
        sort: 'stars',
        order: 'desc',
        per_page: Math.min(limit, 100)
      },
      timeout
    })

    return response.data.items.map((repo: any) => ({
      manifest: {
        id: repo.name,
        name: repo.name,
        version: '1.0.0',
        description: repo.description || '',
        author: repo.owner.login,
        homepage: repo.html_url,
        main: 'index.js',
        vniteVersion: '1.0.0'
      } as PluginManifest,
      downloadUrl: `${repo.html_url}/archive/main.zip`,
      size: repo.size * 1024, // GitHub返回的是KB
      checksum: '',
      publishTime: new Date(repo.created_at)
    }))
  }

  /**
   * 搜索官方注册表
   */
  private async searchOfficialRegistry(
    registry: PluginRegistry,
    keyword: string,
    options?: {
      category?: string
      limit?: number
    }
  ): Promise<PluginPackage[]> {
    const params: any = {
      q: keyword
    }

    if (options?.category) {
      params.category = options.category
    }

    if (options?.limit) {
      params.limit = options.limit
    }

    const response = await axios.get(`${registry.url}/search`, {
      params,
      timeout: 5000
    })

    return response.data.packages || response.data
  }

  /**
   * 获取插件详情
   */
  public async getPluginDetails(pluginId: string): Promise<PluginPackage | null> {
    const enabledRegistries = this.getEnabledRegistries()

    for (const registry of enabledRegistries) {
      try {
        const details = await this.getPluginDetailsFromRegistry(registry, pluginId)
        if (details) {
          return details
        }
      } catch (error) {
        log.warn(`从注册表 ${registry.name} 获取插件详情失败:`, error)
      }
    }

    return null
  }

  /**
   * 从注册表获取插件详情
   */
  private async getPluginDetailsFromRegistry(
    registry: PluginRegistry,
    pluginId: string
  ): Promise<PluginPackage | null> {
    try {
      const response = await axios.get(`${registry.url}/package/${pluginId}`, {
        timeout: 5000
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * 获取插件版本列表
   */
  public async getPluginVersions(pluginId: string): Promise<string[]> {
    const enabledRegistries = this.getEnabledRegistries()

    for (const registry of enabledRegistries) {
      try {
        const response = await axios.get(`${registry.url}/package/${pluginId}/versions`, {
          timeout: 5000
        })

        return response.data.versions || []
      } catch (error) {
        log.warn(`从注册表 ${registry.name} 获取版本列表失败:`, error)
      }
    }

    return []
  }

  /**
   * 检查插件更新
   */
  public async checkUpdates(installedPlugins: Map<string, any>): Promise<
    Array<{
      pluginId: string
      currentVersion: string
      latestVersion: string
      updateAvailable: boolean
    }>
  > {
    const updateInfo: Array<{
      pluginId: string
      currentVersion: string
      latestVersion: string
      updateAvailable: boolean
    }> = []

    for (const [pluginId, pluginInfo] of installedPlugins) {
      try {
        const details = await this.getPluginDetails(pluginId)
        if (details) {
          const currentVersion = pluginInfo.manifest.version
          const latestVersion = details.manifest.version

          updateInfo.push({
            pluginId,
            currentVersion,
            latestVersion,
            updateAvailable: this.isNewerVersion(latestVersion, currentVersion)
          })
        }
      } catch (error) {
        log.warn(`检查插件 ${pluginId} 更新失败:`, error)
      }
    }

    return updateInfo
  }

  /**
   * 比较版本号
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string): number[] => {
      return version.split('.').map((v) => parseInt(v, 10))
    }

    const newParts = parseVersion(newVersion)
    const currentParts = parseVersion(currentVersion)

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0
      const currentPart = currentParts[i] || 0

      if (newPart > currentPart) return true
      if (newPart < currentPart) return false
    }

    return false
  }

  /**
   * 去重并排序搜索结果
   */
  private deduplicateAndSort(packages: PluginPackage[], keyword: string): PluginPackage[] {
    // 使用插件ID去重
    const uniquePackages = new Map<string, PluginPackage>()

    for (const pkg of packages) {
      const existing = uniquePackages.get(pkg.manifest.id)
      if (!existing || this.isNewerVersion(pkg.manifest.version, existing.manifest.version)) {
        uniquePackages.set(pkg.manifest.id, pkg)
      }
    }

    // 排序：优先匹配关键词的插件
    return Array.from(uniquePackages.values()).sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, keyword)
      const bScore = this.calculateRelevanceScore(b, keyword)
      return bScore - aScore
    })
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevanceScore(pkg: PluginPackage, keyword: string): number {
    let score = 0
    const lowerKeyword = keyword.toLowerCase()

    // 名称完全匹配
    if (pkg.manifest.name.toLowerCase() === lowerKeyword) {
      score += 100
    }

    // 名称包含关键词
    if (pkg.manifest.name.toLowerCase().includes(lowerKeyword)) {
      score += 50
    }

    // 描述包含关键词
    if (pkg.manifest.description.toLowerCase().includes(lowerKeyword)) {
      score += 20
    }

    // 关键词匹配
    if (pkg.manifest.keywords?.some((k) => k.toLowerCase().includes(lowerKeyword))) {
      score += 30
    }

    return score
  }

  /**
   * 验证注册表连接
   */
  public async validateRegistry(registry: PluginRegistry): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      const response = await axios.get(`${registry.url}/health`, {
        timeout: 3000
      })

      return {
        valid: response.status === 200
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        valid: false,
        error: errorMessage
      }
    }
  }
}
