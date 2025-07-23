/**
 * 插件注册表管理器
 *
 * 负责管理插件注册表，处理插件的搜索、下载等功能
 * 主要从GitHub获取插件信息
 */

import { net } from 'electron'
import log from 'electron-log'
import semver from 'semver'
import type {
  PluginRegistry,
  PluginPackage,
  PluginManifest,
  PluginSearchOptions,
  PluginSearchResult,
  PluginCategory,
  PluginInfo
} from '@appTypes/plugin'

// GitHub API 参数常量
const ITEMS_PER_PAGE = 30
const GITHUB_API_URL = 'https://api.github.com'
const PLUGIN_TAG = 'vnite-plugin'
const PLUGIN_CATEGORIES = {
  ALL: 'all',
  COMMON: 'common',
  SCRAPER: 'scraper'
}

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
        name: 'GitHub Registry',
        url: `${GITHUB_API_URL}/search/repositories`,
        enabled: true
      }
    ]

    for (const registry of defaultRegistries) {
      this.registries.set(registry.url, registry)
    }
    log.info('初始化插件注册表完成')
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
   * 使用 net.fetch 执行 HTTP GET 请求并解析 JSON 响应
   */
  private async fetchJson(url: string, options?: RequestInit): Promise<any> {
    const response = await net.fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 搜索插件
   * @param options 搜索选项
   */
  public async searchPlugins(options: PluginSearchOptions): Promise<PluginSearchResult> {
    const {
      keyword = '',
      category = PLUGIN_CATEGORIES.ALL,
      page = 1,
      perPage = ITEMS_PER_PAGE,
      sort = 'stars',
      order = 'desc'
    } = options

    try {
      const enabledRegistries = this.getEnabledRegistries()
      if (enabledRegistries.length === 0) {
        return { plugins: [], totalCount: 0, currentPage: page, totalPages: 0 }
      }

      // 构建GitHub搜索查询
      let query = `topic:${PLUGIN_TAG}`
      if (keyword) {
        query += ` ${keyword}`
      }

      // 添加分类标签筛选
      if (category !== PLUGIN_CATEGORIES.ALL) {
        query += ` topic:${category}`
      }

      // 构建查询URL和参数
      const searchUrl = new URL(`${GITHUB_API_URL}/search/repositories`)
      searchUrl.searchParams.append('q', query)
      searchUrl.searchParams.append('sort', sort)
      searchUrl.searchParams.append('order', order)
      searchUrl.searchParams.append('page', page.toString())
      searchUrl.searchParams.append('per_page', perPage.toString())

      const response = await this.fetchJson(searchUrl.toString(), {
        headers: this.getGitHubHeaders()
      })

      const totalCount = response.total_count
      const totalPages = Math.ceil(totalCount / perPage)

      // 解析搜索结果
      const plugins = await this.parseGitHubSearchResults(response.items)

      return {
        plugins,
        totalCount,
        currentPage: page,
        totalPages
      }
    } catch (error) {
      log.error('搜索插件失败:', error)
      throw new Error(`搜索插件失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 解析GitHub搜索结果
   */
  private async parseGitHubSearchResults(items: any[]): Promise<PluginPackage[]> {
    // 定义分类优先级数组
    const CATEGORY_PRIORITIES = ['scraper', 'common'] as PluginCategory[]

    const plugins: PluginPackage[] = []

    for (const repo of items) {
      try {
        // 获取仓库的详细信息和最新release
        const releasePromise = this.fetchJson(`${repo.url}/releases/latest`, {
          headers: this.getGitHubHeaders()
        }).catch(() => null)

        const contentPromise = this.fetchJson(`${repo.url}/contents/package.json`, {
          headers: this.getGitHubHeaders()
        }).catch((error) => {
          log.warn(`获取 ${repo.name} 的package.json失败:`, error)
          return null
        })

        const [releaseRes, contentRes] = await Promise.all([releasePromise, contentPromise])

        // 处理release信息
        let downloadUrl = ''
        let version = '0.0.1'

        if (releaseRes) {
          const release = releaseRes
          // 查找.vnpkg文件
          const vnpkgAsset = release.assets?.find((asset: any) => asset.name.endsWith('.vnpkg'))

          if (vnpkgAsset) {
            downloadUrl = vnpkgAsset.browser_download_url
            version = release.tag_name.replace(/^v/, '') // 去掉版本号前面的v
          }
        }

        // 如果没有找到.vnpkg文件，使用ZIP下载
        if (!downloadUrl) {
          downloadUrl = `${repo.html_url}/archive/refs/heads/main.zip`
        }

        // 尝试获取插件清单
        let manifest: PluginManifest = {
          id: repo.name,
          name: repo.name,
          version,
          description: repo.description || '无描述',
          author: repo.owner.login,
          homepage: repo.html_url,
          main: 'index.js',
          vniteVersion: '4.0.0'
        }

        // 如果能获取到package.json，优先使用其id和name，并补全其他字段
        if (contentRes) {
          try {
            const content = Buffer.from(contentRes.content, 'base64').toString('utf8')
            const packageJson = JSON.parse(content)

            manifest = {
              // 基础字段，默认使用从仓库获取的信息
              id: packageJson.id || repo.name,
              name: packageJson.name || repo.name,
              version,
              description: repo.description || packageJson.description || '无描述',
              author: repo.owner.login,
              homepage: repo.html_url,
              main: packageJson.main || 'index.js',
              vniteVersion: packageJson.vniteVersion || '4.0.0'
            }
          } catch (e) {
            log.warn(`解析 ${repo.name} 的package.json失败:`, e)
          }
        }

        // 分析仓库标签
        const topics = repo.topics || []

        // 根据优先级确定分类
        let category = 'common' as PluginCategory

        // 查找第一个匹配的分类
        for (const priorityCategory of CATEGORY_PRIORITIES) {
          if (topics.includes(priorityCategory)) {
            category = priorityCategory
            break // 找到第一个匹配的分类后停止
          }
        }

        // 如果package.json中已经明确定义了分类，优先使用
        if (manifest.category && CATEGORY_PRIORITIES.includes(manifest.category)) {
          category = manifest.category
        }

        let readme = ''
        try {
          const readmeRes = await this.fetchJson(`${repo.url}/readme`, {
            headers: this.getGitHubHeaders()
          })
          readme = Buffer.from(readmeRes.content, 'base64').toString('utf8')
        } catch (e) {
          log.warn(`获取 ${repo.name} 的README失败:`, e)
          // 这里是正常的错误处理，因为有些仓库可能没有README
        }

        plugins.push({
          manifest: {
            ...manifest,
            keywords: topics,
            category // 使用确定的分类
          },
          downloadUrl,
          size: repo.size * 1024,
          checksum: '',
          publishTime: repo.pushed_at || repo.created_at,
          stars: repo.stargazers_count,
          updatedAt: repo.updated_at,
          owner: repo.owner.login,
          repoUrl: repo.html_url,
          readme,
          homepageUrl: repo.homepage
        })
      } catch (error) {
        log.warn(`处理仓库 ${repo.name} 信息失败:`, error)
      }
    }

    return plugins
  }

  /**
   * 获取插件详情
   */
  public async getPluginDetails(repoInfo: {
    owner: string
    name: string
  }): Promise<PluginPackage | null> {
    try {
      const repo = await this.fetchJson(
        `${GITHUB_API_URL}/repos/${repoInfo.owner}/${repoInfo.name}`,
        {
          headers: this.getGitHubHeaders()
        }
      )

      // 获取最新release信息
      const releaseRes = await this.fetchJson(`${repo.url}/releases/latest`, {
        headers: this.getGitHubHeaders()
      }).catch(() => null)

      let downloadUrl = `${repo.html_url}/archive/refs/heads/main.zip`
      let version = '0.0.1'

      if (releaseRes) {
        const release = releaseRes
        const vnpkgAsset = release.assets?.find((asset: any) => asset.name.endsWith('.vnpkg'))

        if (vnpkgAsset) {
          downloadUrl = vnpkgAsset.browser_download_url
          version = release.tag_name.replace(/^v/, '')
        }
      }

      // 尝试获取插件清单
      const contentRes = await this.fetchJson(`${repo.url}/contents/plugin.json`, {
        headers: this.getGitHubHeaders()
      }).catch(() => null)

      let manifest: PluginManifest = {
        id: repo.name,
        name: repo.name,
        version,
        description: repo.description || '无描述',
        author: repo.owner.login,
        homepage: repo.html_url,
        main: 'index.js',
        vniteVersion: '1.0.0'
      }

      if (contentRes) {
        try {
          const content = Buffer.from(contentRes.content, 'base64').toString('utf8')
          const pluginJson = JSON.parse(content)
          manifest = { ...manifest, ...pluginJson }
        } catch (e) {
          log.warn(`解析 ${repo.name} 的plugin.json失败:`, e)
        }
      }

      const categories = repo.topics || []

      return {
        manifest: {
          ...manifest,
          keywords: repo.topics || [],
          category: categories.includes('scraper') ? 'scraper' : 'common'
        },
        downloadUrl,
        size: repo.size * 1024,
        checksum: '',
        publishTime: repo.pushed_at || repo.created_at,
        stars: repo.stargazers_count,
        updatedAt: repo.updated_at,
        owner: repo.owner.login,
        repoUrl: repo.html_url
      }
    } catch (error) {
      log.error(`获取插件 ${repoInfo.owner}/${repoInfo.name} 详情失败:`, error)
      return null
    }
  }

  /**
   * 获取插件版本列表
   */
  public async getPluginVersions(pluginId: string): Promise<string[]> {
    try {
      const releases = await this.fetchJson(`${GITHUB_API_URL}/repos/${pluginId}/releases`, {
        headers: this.getGitHubHeaders()
      })

      return releases
        .filter((release: any) => !release.draft && !release.prerelease)
        .map((release: any) => release.tag_name.replace(/^v/, ''))
    } catch (error) {
      log.error(`获取插件 ${pluginId} 版本列表失败:`, error)
      return []
    }
  }

  /**
   * 检查插件更新
   */
  public async checkUpdates(installedPlugins: Map<string, PluginInfo>): Promise<
    Array<{
      pluginId: string
      currentVersion: string
      latestVersion: string
      updateAvailable: boolean
      downloadUrl?: string
    }>
  > {
    const updateInfo: Array<{
      pluginId: string
      currentVersion: string
      latestVersion: string
      updateAvailable: boolean
      downloadUrl?: string
    }> = []

    for (const [pluginId, pluginInfo] of installedPlugins) {
      try {
        if (
          !pluginInfo.manifest.repo ||
          !pluginInfo.manifest.repo.owner ||
          !pluginInfo.manifest.repo.name
        ) {
          log.warn(`插件 ${pluginId} 没有配置GitHub仓库信息，无法检查更新`)
          continue
        }
        const details = await this.getPluginDetails(pluginInfo.manifest.repo)
        if (details) {
          const currentVersion = pluginInfo.manifest.version
          const latestVersion = details.manifest.version
          const cleanNew = semver.valid(semver.coerce(latestVersion))
          const cleanCurrent = semver.valid(semver.coerce(currentVersion))
          if (!cleanNew || !cleanCurrent) {
            log.warn(`插件 ${pluginId} 版本号不合法，无法检查更新`)
            continue
          }
          const isNewer = semver.gt(cleanNew, cleanCurrent)

          updateInfo.push({
            pluginId,
            currentVersion,
            latestVersion,
            updateAvailable: isNewer,
            downloadUrl: isNewer ? details.downloadUrl : undefined
          })
        }
      } catch (error) {
        log.warn(`检查插件 ${pluginId} 更新失败:`, error)
      }
    }

    return updateInfo
  }

  /**
   * 获取GitHub API请求头
   */
  private getGitHubHeaders(): Record<string, string> {
    return {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }
}
