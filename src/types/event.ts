export interface EventMetadata {
  id: string
  timestamp: number
  source: string
  correlationId?: string
}

export interface AppEvents {
  'app:ready': undefined

  'game:added': {
    gameId: string
    name: string
    dataSource?: string
    metadata?: Record<string, any>
  }

  'game:launched': {
    gameId: string
    launchMode?: string
    launchConfig?: Record<string, any>
  }

  'game:stopped': {
    gameId: string
    duration: number
    playtime?: number
  }

  'game:deleted': {
    gameId: string
    name: string
  }

  'game:save-created': {
    gameId: string
    saveId: string
  }

  'game:save-restored': {
    gameId: string
    saveId: string
  }

  'game:save-deleted': {
    gameId: string
    saveId: string
  }

  'game:memory-created': {
    gameId: string
    memoryId: string
  }

  'game:memory-deleted': {
    gameId: string
    memoryId: string
  }

  'game:memory-cover-updated': {
    gameId: string
    memoryId: string
  }

  'game:play-status-changed': {
    gameId: string
    status: 'unplayed' | 'playing' | 'partial' | 'finished' | 'multiple' | 'shelved'
  }

  'theme:preset-changed': {
    preset: string
  }

  'plugin:enabled': {
    pluginId: string
  }

  'plugin:disabled': {
    pluginId: string
  }

  'plugin:installed': {
    pluginId: string
    activate: boolean
  }

  'plugin:uninstalled': {
    pluginId: string
    removeData: boolean
  }

  'scanner:started': {
    scannerId: string
    scannerPath: string
    totalScanners?: number
  }

  'scanner:completed': {
    scannerId: string
    gamesAdded: number
    duration: number
    failedFolders: number
    totalProcessed: number
  }

  'scanner:folder-fixed': {
    scannerId: string
    folderPath: string
    gameId: string
  }

  'scanner:folder-ignored': {
    scannerId: string
    folderPath: string
  }

  'language:changed': {
    newLanguage: string
  }

  'plugin:loaded': {
    pluginId: string
    pluginName: string
    version: string
    loadTime: number
  }

  'plugin:unloaded': {
    pluginId: string
    pluginName: string
    reason: 'user' | 'error' | 'update'
  }

  'plugin:error': {
    pluginId: string
    error: string
    context: string
    canRecover: boolean
  }

  'db:backup-completed': {
    targetPath: string
  }

  'db:restore-completed': {
    sourcePath: string
  }

  'tray:config-updated': undefined
}

export type EventHandler<T extends EventType> = (data: EnhancedEventData<T>) => void | Promise<void>
export type EventUnsubscribe = () => void

export interface EventHistoryEntry {
  eventType: EventType
  data: EnhancedEventData<EventType>
  timestamp: number
  id: string
}

export interface EventHistoryQuery {
  eventType?: EventType
  limit?: number
  offset?: number
  fromTimestamp?: number
  toTimestamp?: number
  source?: string
  correlationId?: string
}

export type EventType = keyof AppEvents
export type EventData<T extends EventType> = AppEvents[T]

// Enhanced event data with metadata
export type EnhancedEventData<T extends EventType> = AppEvents[T] & EventMetadata
