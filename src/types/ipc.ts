import {
  EnhancedEventData,
  EventData,
  EventHistoryEntry,
  EventHistoryQuery,
  EventType
} from '@appTypes/event'
import { BatchUpdateGameMetadataProgress, OverallScanProgress } from '@appTypes/utils'
import { ProgressInfo, UpdateCheckResult } from 'electron-updater'
import { BatchGameInfo, configDocs } from './models'
import {
  PluginConfiguration,
  PluginInfo,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginSearchResult,
  PluginStatsData,
  PluginUpdateInfo
} from './plugin'
import {
  GameDescriptionList,
  GameDevelopersList,
  GameExtraInfoList,
  GameGenresList,
  GameInformationList,
  GameList,
  GameMetadata,
  GameMetadataField,
  GameMetadataUpdateMode,
  GameMetadataUpdateOptions,
  GamePlatformsList,
  GamePublishersList,
  GameRelatedSitesList,
  GameTagsList,
  ScraperCapabilities,
  ScraperIdentifier,
  SteamFormattedGameInfo
} from './utils'

/**
 * IPC Events Type Definitions
 * Define all IPC communication contracts between main and renderer processes
 */

// Main process IPC events - handled by main process
type MainIpcEvents =
  | {
      // Listener events (one-way communication from renderer to main)
      'app:ping': [message: string]
      'app:log': [level: 'info' | 'warn' | 'error', message: string, data?: unknown]
      'window:minimize': []
      'window:maximize': []
      'window:restore-and-focus': []
      'window:quit-to-tray': []
      'window:close': []
      'window:restore': []

      'app:relaunch-app': []
      'app:switch-database-mode': []
      'app:check-portable-mode': []
      'app:switch-to-portable-mode': []
      'app:switch-to-normal-mode': []

      'launcher:start-game': [gameId: string]

      'native-monitor:add-local-game': [gameId: string, monitorPath: string]
      'native-monitor:remove-local-game': [monitorPath: string]
      'native-monitor:update-local-game': []
      'system:change-process-monitor': [monitor: 'new' | 'legacy']
    }
  | {
      // Handler events (request-response communication from renderer to main)

      'system:select-path-dialog': (
        properties: NonNullable<Electron.OpenDialogOptions['properties']>,
        extensions?: string[],
        defaultPath?: string
      ) => string | undefined
      'system:select-multiple-path-dialog': (
        properties: NonNullable<Electron.OpenDialogOptions['properties']>,
        extensions?: string[],
        defaultPath?: string
      ) => string[] | undefined
      'system:save-image-as-file-dialog': (sourcePath: string) => boolean
      'system:get-path-size': (paths: string[]) => number
      'system:read-file-buffer': (filePath: string) => Buffer
      'system:open-path-in-explorer': (filePath: string) => void
      'system:get-language': () => string
      'system:check-admin-permissions': () => boolean
      'system:check-if-portable-directory-needs-admin-rights': () => boolean
      'system:get-fonts': () => string[]
      'system:update-screenshot-hotkey': (hotkey: string) => void
      'system:delete-temp-file': (path: string) => void

      'app:update-language': (language: string) => void
      'app:get-app-version': () => string
      'app:is-portable-mode': () => boolean
      'app:switch-database-mode': () => void

      'utils:open-database-path-in-explorer': () => void
      'utils:create-game-shortcut': (gameId: string, targetPath: string) => void
      'utils:update-open-at-login': () => void
      'utils:generate-uuid': () => string
      'utils:crop-image': (params: {
        sourcePath: string
        x: number
        y: number
        width: number
        height: number
      }) => string
      'utils:save-game-icon-by-file': (gameId: string, filePath: string) => void
      'utils:download-temp-image': (url: string) => string
      'utils:save-clipboard-image': () => string
      'utils:write-clipboard-image': (data: string, type: 'path') => boolean
      'utils:get-app-log-contents-in-current-lifetime': () => string
      'utils:copy-app-log-in-current-lifetime-to-clipboard-as-file': () => void
      'utils:open-log-path-in-explorer': () => void

      // Transformer events
      'transformer:transform-metadata': (
        metadata: GameMetadata,
        transformerIds: string[] | '#all'
      ) => GameMetadata
      'transformer:export-transformer': (
        transformer: configDocs['metadata']['transformer']['list'][number],
        targetPath: string
      ) => void
      'transformer:import-transformer': (sourcePath: string) => void
      'transformer:transform-all-games': (transformerIds: string[] | '#all') => number
      'transformer:apply-metadata-to-game': (gameId: string, metadata: GameMetadata) => void
      'transformer:get-localized-field-label': (key: string, lang?: string) => string

      // Database backup & restore events
      'db:backup': (targetPath: string) => void
      'db:restore': (sourcePath: string) => void
      'db:get-couchdb-size': (refreshCache?: boolean) => number
      'db:set-config-background': (path: string, theme: 'dark' | 'light') => void
      'db:check-attachment': (dbName: string, docId: string, attachmentId: string) => boolean
      'db:get-all-docs': (dbName: string) => Record<string, any>
      'db:restart-sync': () => void
      'db:full-sync': () => void
      'db:stop-sync': () => void
      'db:doc-changed': (change: {
        dbName: string
        docId: string
        data: any
        timestamp: number
      }) => void
      'db:compact-remote-database': () => void
      'db:reset-appearances-settings': () => void
      'db:remove-config-background': (theme: 'dark' | 'light' | '#all') => void

      // Game save management events
      'game:backup-save': (gameId: string) => string
      'game:restore-save': (gameId: string, saveId: string) => void
      'game:delete-save': (gameId: string, saveId: string) => void

      // Game memory management events
      'game:add-memory': (gameId: string) => void
      'game:delete-memory': (gameId: string, memoryId: string) => void
      'game:update-memory-cover': (gameId: string, memoryId: string, imgPath: string) => void

      // Game media management events
      'game:set-image': (
        gameId: string,
        type: 'background' | 'cover' | 'logo' | 'icon',
        image: string
      ) => void
      'game:get-media-path': (
        gameId: string,
        type: 'cover' | 'background' | 'icon' | 'logo'
      ) => string | null
      'game:remove-media': (gameId: string, type: 'cover' | 'background' | 'icon' | 'logo') => void
      'game:get-memory-cover-path': (gameId: string, memoryId: string) => string | null

      // Game management events
      'game:check-exits-by-path': (gamePath: string) => boolean
      'game:delete': (gameId: string) => void

      // Authentication events
      'account:auth-signin': () => boolean
      'account:auth-signup': () => boolean

      'adder:add-game-to-db': (data: {
        dataSource: string
        dataSourceId: string
        backgroundUrl?: string
        dirPath?: string
        gamePath?: string
      }) => void
      'adder:update-game-metadata': (data: {
        dbId: string
        dataSource: string
        dataSourceId: string
        fields?: (GameMetadataField | GameMetadataUpdateMode)[]
        backgroundUrl?: string
        options?: GameMetadataUpdateOptions
      }) => void
      'adder:get-batch-game-adder-data': () => BatchGameInfo[]
      'adder:add-game-to-db-without-metadata': (dirPath: string, gamePath: string) => void
      'adder:batch-update-game-metadata': (data: {
        gameIds: string[]
        dataSource: string
        fields?: (GameMetadataField | GameMetadataUpdateMode)[]
        options?: GameMetadataUpdateOptions
        concurrency?: number
      }) => void

      'importer:import-v2-data': (dataPath: string) => void
      'importer:get-steam-games': (steamId: string) => SteamFormattedGameInfo[]
      'importer:import-selected-steam-games': (games: SteamFormattedGameInfo[]) => number

      'launcher:select-preset': (presetName: string, gameId: string, steamId?: string) => void

      'scraper:search-games': (dataSource: string, gameName: string) => GameList
      'scraper:check-game-exists': (dataSource: string, identifier: ScraperIdentifier) => boolean
      'scraper:get-game-metadata': (
        dataSource: string,
        identifier: ScraperIdentifier
      ) => GameMetadata
      'scraper:get-game-backgrounds': (
        dataSource: string,
        identifier: ScraperIdentifier
      ) => string[]
      'scraper:get-game-covers': (dataSource: string, identifier: ScraperIdentifier) => string[]
      'scraper:get-game-icons': (dataSource: string, identifier: ScraperIdentifier) => string[]
      'scraper:get-game-logos': (dataSource: string, identifier: ScraperIdentifier) => string[]
      'scraper:get-game-description-list': (identifier: ScraperIdentifier) => GameDescriptionList
      'scraper:get-game-tags-list': (identifier: ScraperIdentifier) => GameTagsList
      'scraper:get-game-extra-info-list': (identifier: ScraperIdentifier) => GameExtraInfoList
      'scraper:get-game-developers-list': (identifier: ScraperIdentifier) => GameDevelopersList
      'scraper:get-game-publishers-list': (identifier: ScraperIdentifier) => GamePublishersList
      'scraper:get-game-genres-list': (identifier: ScraperIdentifier) => GameGenresList
      'scraper:get-game-platforms-list': (identifier: ScraperIdentifier) => GamePlatformsList
      'scraper:get-game-related-sites-list': (identifier: ScraperIdentifier) => GameRelatedSitesList
      'scraper:get-game-information-list': (identifier: ScraperIdentifier) => GameInformationList
      'scraper:get-provider-infos-with-capabilities': (
        capabilities: ScraperCapabilities[],
        requireAll?: boolean
      ) => {
        id: string
        name: string
        capabilities: ScraperCapabilities[]
      }[]

      // Theme events
      'theme:save': (cssContent: string) => void
      'theme:load': () => string | null
      'theme:select-preset': (preset: string) => string

      // Updater events
      'updater:check-update': () => UpdateCheckResult | null
      'updater:start-update': () => Array<string>
      'updater:install-update': () => void
      'updater:update-config': () => void

      // EventBus IPC handlers
      'events:emit': <T extends EventType>(
        eventType: T,
        data: EventData<T>,
        options: { source: string; correlationId?: string }
      ) => boolean
      'events:query-history': (options?: EventHistoryQuery) => EventHistoryEntry[]
      'events:get-total-events': () => number
      'events:get-events-by-type': () => Record<string, number>
      'events:get-recent-events': (limit?: number) => EventHistoryEntry[]
      'events:clear-history': () => void
      'events:get-history-stats': () => {
        totalEvents: number
        uniqueEventTypes: number
        oldestEvent?: EventHistoryEntry
        newestEvent?: EventHistoryEntry
        averageEventsPerMinute: number
      }

      'scanner:scan-all': () => OverallScanProgress
      'scanner:scan-scanner': (scannerId: string) => OverallScanProgress
      'scanner:stop-scan': () => OverallScanProgress
      'scanner:get-progress': () => OverallScanProgress
      'scanner:fix-folder': (
        folderPath: string,
        gameId: string,
        dataSource: string
      ) => OverallScanProgress
      'scanner:start-periodic-scan': () => {
        active: boolean
        lastScanTime: number
        autoStart: boolean
        interval: number | null
      }
      'scanner:stop-periodic-scan': () => {
        active: boolean
        lastScanTime: number
        autoStart: boolean
        interval: number | null
      }
      'scanner:get-periodic-scan-status': () => {
        active: boolean
        lastScanTime: number
        autoStart: boolean
        interval: number | null
      }
      'scanner:request-progress': () => OverallScanProgress
      'scanner:ignore-failed-folder': (scannerId: string, folderPath: string) => OverallScanProgress

      // Plugin events
      'plugin:get-all-plugins': () => Omit<PluginInfo, 'instance'>[]
      'plugin:get-plugin': (pluginId: string) => Omit<PluginInfo, 'instance'> | undefined
      'plugin:search-plugins': (options: PluginSearchOptions) => PluginSearchResult
      'plugin:install-plugin': (
        source: string,
        options?: PluginInstallOptions
      ) => { success: boolean; error?: string }
      'plugin:install-plugin-from-file': (
        filePath: string,
        options?: PluginInstallOptions
      ) => { success: boolean; error?: string }
      'plugin:uninstall-plugin': (pluginId: string) => { success: boolean; error?: string }
      'plugin:activate-plugin': (pluginId: string) => { success: boolean; error?: string }
      'plugin:deactivate-plugin': (pluginId: string) => { success: boolean; error?: string }
      'plugin:check-updates': () => PluginUpdateInfo[]
      'plugin:get-stats': () => PluginStatsData
      'plugin:get-plugin-configuration': (pluginId: string) => PluginConfiguration[]
    }

// Renderer process IPC events - handled by renderer process
type RendererIpcEvents = {
  // Events sent from main to renderer

  // Database events
  'db:doc-changed': [{ dbName: string; docId: string; data: any; timestamp: number }]
  'db:attachment-changed': [
    { dbName: string; docId: string; attachmentId: string; timestamp: number }
  ]
  'db:sync-status': [
    { status: 'syncing' | 'success' | 'error'; message: string; timestamp: string }
  ]
  'db:full-sync-error': [error: string]
  'db:full-synced': []
  'db:full-syncing': []

  // Authentication events
  'account:auth-success': []
  'account:auth-failed': [error: string]
  'account:update-user-info-error': []

  'window:maximized': []
  'window:unmaximized': []

  'updater:update-error': [error: string]
  'updater:update-available': [
    {
      version: string
      releaseNotes: string
    }
  ]
  'updater:checking-for-update': []
  'updater:update-not-available': []
  'updater:download-progress': [progressInfo: ProgressInfo]
  'updater:update-downloaded': []

  // EventBus events forwarded from main process
  'events:event-emitted': [eventType: EventType, data: EnhancedEventData<EventType>]

  'game:started': [gameId: string]
  'game:exiting': [gameId: string]
  'game:exited': [gameId: string]
  'game:start-from-url': [gameId: string]
  'game:launch-failed': [gameId: string]

  'importer:import-steam-games-progress': [
    {
      current: number
      total: number
      status: 'started' | 'processing' | 'completed' | 'error'
      message: string
      game?: {
        name: string
        status: 'success' | 'error'
        error?: string
      }
    }
  ]

  'scanner:scan-start': [progress: OverallScanProgress]
  'scanner:scan-progress': [progress: OverallScanProgress]
  'scanner:scan-completed': [progress: OverallScanProgress]
  'scanner:scan-stopped': [progress: OverallScanProgress]
  'scanner:scan-folder-error': [progress: OverallScanProgress]
  'scanner:scan-folder-fixed': [progress: OverallScanProgress]
  'scanner:scan-error': [progress: OverallScanProgress]
  'scanner:scan-paused': [progress: OverallScanProgress]
  'scanner:scan-resumed': [progress: OverallScanProgress]

  'adder:batch-update-game-metadata-progress': [progress: BatchUpdateGameMetadataProgress]

  'plugin:update-all-plugins': [plugins: Omit<PluginInfo, 'instance'>[]]
  'plugin:update-plugin-stats': [stats: PluginStatsData]
}

// Export types for use in both main and renderer
declare global {
  type IpcMainEvents = MainIpcEvents
  type IpcRendererEvents = RendererIpcEvents
}

export {}
