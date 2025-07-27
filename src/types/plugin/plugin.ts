export interface PluginManifest {
  /** Plugin ID, must be unique */
  id: string
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin description */
  description: string
  /** Plugin author */
  author: string
  /** Plugin homepage */
  homepage?: string
  /** Plugin license */
  license?: string
  /** Minimum supported Vnite version */
  vniteVersion: string
  /** Plugin main entry file */
  main: string
  /** Plugin icon path */
  icon?: string
  /** Plugin keywords */
  keywords?: string[]
  /** Plugin category */
  category?: PluginCategory
  /** Plugin dependencies */
  dependencies?: Record<string, string>
  /** Development dependencies */
  devDependencies?: Record<string, string>
  /** Plugin configuration */
  configuration?: PluginConfiguration[]
  /** Github repository information */
  repo?: {
    owner: string
    name: string
  }
}

interface BasePluginConfiguration {
  id: string
  title: string
  default: any
  description?: string
  /** Common style configuration */
  controlClassName?: string
}

interface StringPluginConfiguration extends BasePluginConfiguration {
  type: 'string'
  controlOptions: {
    controlType: 'input' | 'textarea'
    inputType?: 'text' | 'email' | 'password' | 'url'
    placeholder?: string
    rows?: number // for textarea
  }
}

interface NumberPluginConfiguration extends BasePluginConfiguration {
  type: 'number'
  controlOptions: {
    controlType: 'input' | 'slider'
    placeholder?: string
    // slider specific configuration
    min?: number
    max?: number
    step?: number
    formatValue?: (value: number) => string
  }
}

interface BooleanPluginConfiguration extends BasePluginConfiguration {
  type: 'boolean'
  controlOptions: {
    controlType: 'switch'
  }
}

interface SelectPluginConfiguration extends BasePluginConfiguration {
  type: 'select'
  options: Array<{ label: string; value: any }>
  controlOptions: {
    controlType: 'select'
    placeholder?: string
  }
}

interface ArrayPluginConfiguration extends BasePluginConfiguration {
  type: 'array'
  controlOptions: {
    controlType: 'arrayeditor'
    arrayEditorPlaceholder?: string
    arrayEditorTooltipText?: string
    arrayEditorDialogTitle?: string
    arrayEditorDialogPlaceholder?: string
  }
}

interface DatePluginConfiguration extends BasePluginConfiguration {
  type: 'date'
  controlOptions: {
    controlType: 'dateinput'
    placeholder?: string
  }
}

interface FilePluginConfiguration extends BasePluginConfiguration {
  type: 'file'
  controlOptions: {
    controlType: 'fileinput'
    placeholder?: string
    dialogFilters?: Array<{ name: string; extensions: string[] }>
    buttonIcon?: string
    buttonTooltip?: string
  }
}

interface HotkeyPluginConfiguration extends BasePluginConfiguration {
  type: 'hotkey'
  controlOptions: {
    controlType: 'hotkey'
    inputClassName?: string
  }
}

// Plugin configuration union type
export type PluginConfiguration =
  | StringPluginConfiguration
  | NumberPluginConfiguration
  | BooleanPluginConfiguration
  | SelectPluginConfiguration
  | ArrayPluginConfiguration
  | DatePluginConfiguration
  | FilePluginConfiguration
  | HotkeyPluginConfiguration

export type PluginCategory = 'scraper' | 'common'

export enum PluginStatus {
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  LOADING = 'loading',
  ERROR = 'error',
  UNINSTALLED = 'uninstalled'
}

export interface PluginInfo {
  manifest: PluginManifest
  status: PluginStatus
  installPath: string
  installTime: Date
  lastUpdateTime?: Date
  error?: string
  instance?: any
}

export interface PluginSearchResult {
  plugins: PluginPackage[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export interface PluginStatsData {
  total: number
  enabled: number
  disabled: number
  error: number
}

export interface PluginInstallOptions {
  autoEnable?: boolean
  overwrite?: boolean
  onProgress?: (progress: number, message: string) => void
}

export interface PluginSearchOptions {
  keyword?: string
  category?: PluginCategory | 'all'
  page?: number
  perPage?: number
  status?: PluginStatus
  sort?: 'stars' | 'updated' | 'name' | 'status' | 'category' | 'author' | 'date'
  order?: 'desc' | 'asc'
}

export interface PluginRegistry {
  name: string
  url: string
  enabled: boolean
}

export interface PluginPackage {
  manifest: PluginManifest
  downloadUrl: string
  size: number
  checksum: string
  publishTime: string
  installed?: boolean
  stars?: number
  createdAt?: string
  updatedAt?: string
  owner?: string
  repoUrl?: string
  readme?: string
  homepageUrl?: string
}

export interface PluginUpdateInfo {
  pluginId: string
  currentVersion: string
  latestVersion: string
  downloadUrl: string
}
