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
  PluginInfo,
  PluginUpdateInfo
} from '@appTypes/plugin'

// GitHub API constants
const ITEMS_PER_PAGE = 30
const GITHUB_API_URL = 'https://api.github.com'
const PLUGIN_TAG = 'vnite-plugin'
const PLUGIN_CATEGORIES = {
  ALL: 'all',
  COMMON: 'common',
  SCRAPER: 'scraper'
}
// Define category priority array
const CATEGORY_PRIORITIES = ['scraper', 'common'] as PluginCategory[]

export class PluginRegistryManager {
  private registries: Map<string, PluginRegistry> = new Map()

  constructor() {
    this.initializeDefaultRegistries()
  }

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
    log.info('[Plugin] Plugin registry initialization completed')
  }

  public addRegistry(registry: PluginRegistry): void {
    this.registries.set(registry.url, registry)
    log.info(`[Plugin] Added plugin registry: ${registry.name}`)
  }

  public removeRegistry(url: string): boolean {
    const success = this.registries.delete(url)
    if (success) {
      log.info(`[Plugin] Removed plugin registry: ${url}`)
    }
    return success
  }

  public toggleRegistry(url: string, enabled: boolean): boolean {
    const registry = this.registries.get(url)
    if (registry) {
      registry.enabled = enabled
      log.info(`[Plugin] Registry ${enabled ? 'enabled' : 'disabled'}: ${registry.name}`)
      return true
    }
    return false
  }

  public getAllRegistries(): PluginRegistry[] {
    return Array.from(this.registries.values())
  }

  public getEnabledRegistries(): PluginRegistry[] {
    return Array.from(this.registries.values()).filter((r) => r.enabled)
  }

  private async fetchJson(url: string, options?: RequestInit): Promise<any> {
    const response = await net.fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

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

      // Build GitHub search query
      let query = `topic:${PLUGIN_TAG}`
      if (keyword) {
        query += ` ${keyword}`
      }

      // Add category tag filtering
      if (category !== PLUGIN_CATEGORIES.ALL) {
        query += ` topic:${category}`
      }

      // Build query URL and parameters
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

      // Parse search results
      const plugins = await this.parseGitHubSearchResults(response.items)

      return {
        plugins,
        totalCount,
        currentPage: page,
        totalPages
      }
    } catch (error) {
      log.error('[Plugin] Failed to search plugins:', error)
      throw new Error(
        `Failed to search plugins: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async parseGitHubSearchResults(items: any[]): Promise<PluginPackage[]> {
    const plugins: PluginPackage[] = []

    for (const repo of items) {
      try {
        // Get detailed repository information and latest release
        const releasePromise = this.fetchJson(`${repo.url}/releases/latest`, {
          headers: this.getGitHubHeaders()
        }).catch(() => null)

        const contentPromise = this.fetchJson(`${repo.url}/contents/package.json`, {
          headers: this.getGitHubHeaders()
        }).catch((error) => {
          log.warn(`[Plugin] Failed to get package.json for ${repo.name}:`, error)
          return null
        })

        const [releaseRes, contentRes] = await Promise.all([releasePromise, contentPromise])

        // Process release information
        let downloadUrl = ''
        let version = '0.0.1'

        if (releaseRes) {
          const release = releaseRes
          // Look for .vnpkg file
          const vnpkgAsset = release.assets?.find((asset: any) => asset.name.endsWith('.vnpkg'))

          if (vnpkgAsset) {
            downloadUrl = vnpkgAsset.browser_download_url
            version = release.tag_name.replace(/^v/, '') // Remove leading v from version
          }
        }

        // If .vnpkg file not found, use ZIP download
        if (!downloadUrl) {
          downloadUrl = `${repo.html_url}/archive/refs/heads/main.zip`
        }

        // Try to get plugin manifest
        let manifest: PluginManifest = {
          id: repo.name,
          name: repo.name,
          version,
          description: repo.description || 'No description',
          author: repo.owner.login,
          homepage: repo.html_url,
          main: 'index.js',
          vniteVersion: '4.0.0'
        }

        // If package.json is available, use its id and name, and fill in other fields
        if (contentRes) {
          try {
            const content = Buffer.from(contentRes.content, 'base64').toString('utf8')
            const packageJson = JSON.parse(content)

            manifest = {
              // Base fields, default to repository info
              id: packageJson.id || repo.name,
              name: packageJson.name || repo.name,
              version,
              description: repo.description || packageJson.description || 'No description',
              author: repo.owner.login,
              homepage: repo.html_url,
              main: packageJson.main || 'index.js',
              vniteVersion: packageJson.vniteVersion || '4.0.0'
            }
          } catch (e) {
            log.warn(`[Plugin] Failed to parse package.json for ${repo.name}:`, e)
          }
        }

        // Analyze repository tags
        const topics = repo.topics || []

        // Determine category based on priority
        let category = 'common' as PluginCategory

        // Find first matching category
        for (const priorityCategory of CATEGORY_PRIORITIES) {
          if (topics.includes(priorityCategory)) {
            category = priorityCategory
            break // Stop after finding first matching category
          }
        }

        // If category is explicitly defined in package.json, use it
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
          log.warn(`[Plugin] Failed to get README for ${repo.name}:`, e)
          // This is normal error handling, as some repositories might not have README
        }

        plugins.push({
          manifest: {
            ...manifest,
            keywords: topics,
            category
          },
          downloadUrl,
          size: repo.size * 1024,
          checksum: '',
          publishTime: repo.pushed_at || repo.created_at,
          stars: repo.stargazers_count,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          owner: repo.owner.login,
          repoUrl: repo.html_url,
          readme,
          homepageUrl: repo.homepage
        })
      } catch (error) {
        log.warn(`[Plugin] Failed to process repository ${repo.name} information:`, error)
      }
    }

    return plugins
  }

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

      // Get latest release information
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

      // Try to get plugin manifest
      const contentRes = await this.fetchJson(`${repo.url}/contents/package.json`, {
        headers: this.getGitHubHeaders()
      }).catch(() => null)

      let manifest: PluginManifest = {
        id: repo.name,
        name: repo.name,
        version,
        description: repo.description || 'No description',
        author: repo.owner.login,
        homepage: repo.html_url,
        main: 'index.js',
        vniteVersion: '1.0.0'
      }

      // If package.json is available, use its id and name, and fill in other fields
      if (contentRes) {
        try {
          const content = Buffer.from(contentRes.content, 'base64').toString('utf8')
          const packageJson = JSON.parse(content)

          manifest = {
            // Base fields, default to repository info
            id: packageJson.id || repo.name,
            name: packageJson.name || repo.name,
            version,
            description: repo.description || packageJson.description || 'No description',
            author: repo.owner.login,
            homepage: repo.html_url,
            main: packageJson.main || 'index.js',
            vniteVersion: packageJson.vniteVersion || '4.0.0'
          }
        } catch (e) {
          log.warn(`[Plugin] Failed to parse package.json for ${repo.name}:`, e)
        }
      }

      // Analyze repository tags
      const topics = repo.topics || []

      // Determine category based on priority
      let category = 'common' as PluginCategory

      // Find first matching category
      for (const priorityCategory of CATEGORY_PRIORITIES) {
        if (topics.includes(priorityCategory)) {
          category = priorityCategory
          break // Stop after finding first matching category
        }
      }

      // If category is explicitly defined in package.json, use it
      if (manifest.category && CATEGORY_PRIORITIES.includes(manifest.category)) {
        category = manifest.category
      }

      return {
        manifest: {
          ...manifest,
          keywords: repo.topics || [],
          category
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
      log.error(
        `[Plugin] Failed to get plugin details for ${repoInfo.owner}/${repoInfo.name}:`,
        error
      )
      return null
    }
  }

  public async getPluginVersions(pluginId: string): Promise<string[]> {
    try {
      const releases = await this.fetchJson(`${GITHUB_API_URL}/repos/${pluginId}/releases`, {
        headers: this.getGitHubHeaders()
      })

      return releases
        .filter((release: any) => !release.draft && !release.prerelease)
        .map((release: any) => release.tag_name.replace(/^v/, ''))
    } catch (error) {
      log.error(`[Plugin] Failed to get version list for plugin ${pluginId}:`, error)
      return []
    }
  }

  public async checkUpdates(
    installedPlugins: Map<string, PluginInfo>
  ): Promise<PluginUpdateInfo[]> {
    const updateInfo: PluginUpdateInfo[] = []

    for (const [pluginId, pluginInfo] of installedPlugins) {
      try {
        if (
          !pluginInfo.manifest.repo ||
          !pluginInfo.manifest.repo.owner ||
          !pluginInfo.manifest.repo.name
        ) {
          log.warn(
            `[Plugin] Plugin ${pluginId} doesn't have GitHub repository information, cannot check for updates`
          )
          continue
        }
        const details = await this.getPluginDetails(pluginInfo.manifest.repo)
        if (details) {
          const currentVersion = pluginInfo.manifest.version
          const latestVersion = details.manifest.version
          const cleanNew = semver.valid(semver.coerce(latestVersion))
          const cleanCurrent = semver.valid(semver.coerce(currentVersion))
          if (!cleanNew || !cleanCurrent) {
            log.warn(
              `[Plugin] Plugin ${pluginId} has invalid version number, cannot check for updates`
            )
            continue
          }
          const isNewer = semver.gt(cleanNew, cleanCurrent)

          isNewer &&
            updateInfo.push({
              pluginId,
              currentVersion,
              latestVersion,
              downloadUrl: details.downloadUrl
            })
        }
      } catch (error) {
        log.warn(`[Plugin] Failed to check updates for plugin ${pluginId}:`, error)
      }
    }

    return updateInfo
  }

  private getGitHubHeaders(): Record<string, string> {
    return {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }
}

export const pluginRegistryManager = new PluginRegistryManager()
