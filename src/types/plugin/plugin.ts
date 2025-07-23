export interface PluginManifest {
  /** 插件ID，必须唯一 */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description: string
  /** 插件作者 */
  author: string
  /** 插件主页 */
  homepage?: string
  /** 插件许可证 */
  license?: string
  /** 最小支持的Vnite版本 */
  vniteVersion: string
  /** 插件主入口文件 */
  main: string
  /** 插件图标路径 */
  icon?: string
  /** 插件关键词 */
  keywords?: string[]
  /** 插件分类 */
  category?: PluginCategory
  /** 依赖的其他插件 */
  dependencies?: Record<string, string>
  /** 开发依赖 */
  devDependencies?: Record<string, string>
  /** 插件配置项 */
  configuration?: PluginConfiguration[]
}

// 基础插件配置项接口
interface BasePluginConfiguration {
  id: string
  title: string
  default: any
  description?: string
  /** 通用样式配置 */
  controlClassName?: string
}

// 字符串类型配置
interface StringPluginConfiguration extends BasePluginConfiguration {
  type: 'string'
  controlOptions: {
    controlType: 'input' | 'textarea'
    inputType?: 'text' | 'email' | 'password' | 'url'
    placeholder?: string
    rows?: number // textarea专用
  }
}

// 数字类型配置
interface NumberPluginConfiguration extends BasePluginConfiguration {
  type: 'number'
  controlOptions: {
    controlType: 'input' | 'slider'
    placeholder?: string
    // slider专用配置
    min?: number
    max?: number
    step?: number
    formatValue?: (value: number) => string
  }
}

// 布尔类型配置
interface BooleanPluginConfiguration extends BasePluginConfiguration {
  type: 'boolean'
  controlOptions: {
    controlType: 'switch'
  }
}

// 选择类型配置
interface SelectPluginConfiguration extends BasePluginConfiguration {
  type: 'select'
  options: Array<{ label: string; value: any }>
  controlOptions: {
    controlType: 'select'
    placeholder?: string
  }
}

// 数组类型配置
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

// 日期类型配置
interface DatePluginConfiguration extends BasePluginConfiguration {
  type: 'date'
  controlOptions: {
    controlType: 'dateinput'
    placeholder?: string
  }
}

// 文件类型配置
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

// 快捷键类型配置
interface HotkeyPluginConfiguration extends BasePluginConfiguration {
  type: 'hotkey'
  controlOptions: {
    controlType: 'hotkey'
    inputClassName?: string
  }
}

// 插件配置项联合类型
export type PluginConfiguration =
  | StringPluginConfiguration
  | NumberPluginConfiguration
  | BooleanPluginConfiguration
  | SelectPluginConfiguration
  | ArrayPluginConfiguration
  | DatePluginConfiguration
  | FilePluginConfiguration
  | HotkeyPluginConfiguration

export enum PluginCategory {
  GAME = 'game',
  THEME = 'theme',
  SCRAPER = 'scraper',
  UTILITY = 'utility',
  LANGUAGE = 'language',
  IMPORTER = 'importer',
  LAUNCHER = 'launcher',
  OTHER = 'other'
}

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
  id: string
  name: string
  version: string
  description?: string
  author?: string
  source: 'local' | 'registry'
  installed: boolean
}

export interface PluginStatsData {
  total: number
  enabled: number
  disabled: number
  error: number
}

export interface PluginInstallOptions {
  /** 是否自动启用 */
  autoEnable?: boolean
  /** 是否覆盖已存在的插件 */
  overwrite?: boolean
  /** 安装后的回调 */
  onProgress?: (progress: number, message: string) => void
}

export interface PluginSearchOptions {
  /** 搜索关键词 */
  keyword?: string
  /** 插件分类 */
  category?: PluginCategory
  /** 是否只显示已安装的 */
  installedOnly?: boolean
  /** 是否只显示已启用的 */
  enabledOnly?: boolean
}

export interface PluginRegistry {
  /** 注册表名称 */
  name: string
  /** 注册表URL */
  url: string
  /** 是否默认启用 */
  enabled: boolean
}

export interface PluginPackage {
  manifest: PluginManifest
  downloadUrl: string
  size: number
  checksum: string
  publishTime: Date
}
