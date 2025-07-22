export type GameList = {
  id: string
  name: string
  releaseDate: string
  developers: string[]
}[]

export type GameMetadata = {
  name: string
  originalName: string | null
  releaseDate: string
  description: string
  developers: string[]
  relatedSites: {
    label: string
    url: string
  }[]
  tags: string[]
  publishers?: string[]
  genres?: string[]
  platforms?: string[]
  extra?: {
    key: string
    value: string[]
  }[]
}

export type ScraperIdentifier = {
  type: 'id' | 'name'
  value: string
}

export type GameDescriptionList = {
  dataSource: string
  description: string
}[]

export type GameTagsList = {
  dataSource: string
  tags: string[]
}[]

export type GameExtraInfoList = {
  dataSource: string
  extra: {
    key: string
    value: string[]
  }[]
}[]

export type ScraperCapabilities =
  | 'searchGames'
  | 'checkGameExists'
  | 'getGameMetadata'
  | 'getGameBackgrounds'
  | 'getGameCovers'
  | 'getGameLogos'
  | 'getGameIcons'

// 定义可更新的元数据字段类型
export type GameMetadataField =
  // 基本信息
  | 'name'
  | 'originalName'
  | 'releaseDate'
  | 'description'

  // 开发和发布信息
  | 'developers'
  | 'publishers'

  // 分类信息
  | 'genres'
  | 'platforms'
  | 'tags'

  // 其他信息
  | 'relatedSites'
  | 'extra'

  // 图像资源
  | 'cover'
  | 'background'
  | 'logo'
  | 'icon'

export const AllGameMetadataUpdateFields: (GameMetadataField | GameMetadataUpdateMode)[] = [
  '#all',
  '#missing',
  'name',
  'originalName',
  'releaseDate',
  'description',
  'developers',
  'publishers',
  'genres',
  'platforms',
  'tags',
  'relatedSites',
  'extra',
  'cover',
  'background',
  'logo',
  'icon'
]

// 定义特殊更新模式
export type GameMetadataUpdateMode = '#all' | '#missing'

// 定义完整的更新选项类型
export interface GameMetadataUpdateOptions {
  /**
   * 是否覆盖已存在的数据
   * @default true
   */
  overwriteExisting?: boolean

  /**
   * 是否更新图像资源（当请求更新图像字段时）
   * @default true
   */
  updateImages?: boolean

  /**
   * 合并策略 - 应用于数组类型的字段
   * - 'replace': 完全替换现有数据
   * - 'append': 将新数据追加到现有数据
   * - 'merge': 合并新旧数据并移除重复项
   * @default 'merge'
   */
  mergeStrategy?: 'replace' | 'append' | 'merge'

  /**
   * 来源优先级列表 - 按优先级顺序的数据源ID数组
   * @default []
   */
  sourcesPriority?: string[]
}

/**
 * 单个游戏的批量更新结果
 */
export interface BatchUpdateResult {
  /** 游戏数据库ID */
  gameId: string
  /** 更新是否成功 */
  success: boolean
  /** 如果失败，错误信息 */
  error?: string
  /** 数据源ID（如果成功） */
  dataSourceId: string | null
  /** 游戏名称 */
  gameName: string | null
}

/**
 * 批量更新的整体结果
 */
export interface BatchUpdateResults {
  /** 总游戏数 */
  totalGames: number
  /** 成功更新的游戏数 */
  successfulUpdates: number
  /** 更新失败的游戏数 */
  failedUpdates: number
  /** 每个游戏的详细结果 */
  results: BatchUpdateResult[]
}

export interface BatchUpdateGameMetadataProgress {
  gameId: string
  gameName: string | null
  dataSource: string
  dataSourceId: string | null
  fields: (GameMetadataField | GameMetadataUpdateMode)[]
  options: GameMetadataUpdateOptions
  status: 'success' | 'error'
  error?: string
  current: number
  total: number
}
