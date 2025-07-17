import { Paths } from 'type-fest'

export type gameDocs = {
  [gameId: string]: gameDoc
}

export interface gameDoc {
  _id: string
  metadata: {
    name: string
    originalName: string
    releaseDate: string
    description: string
    developers: string[]
    publishers: string[]
    platforms: string[]
    genres: string[]
    tags: string[]
    relatedSites: {
      label: string
      url: string
    }[]
    steamId: string
    vndbId: string
    igdbId: string
    ymgalId: string
    extra: {
      key: string
      value: string[]
    }[]
  }
  record: {
    addDate: string
    lastRunDate: string
    score: number
    playTime: number
    playStatus: 'unplayed' | 'playing' | 'finished' | 'multiple' | 'shelved'
    timers: {
      start: string
      end: string
    }[]
  }
  save: {
    saveList: {
      [saveId: string]: {
        _id: string
        date: string
        note: string
        locked: boolean
      }
    }
    maxBackups: number
  }
  memory: {
    memoryList: {
      [memoryId: string]: {
        _id: string
        date: string
        note: string
      }
    }
  }
  apperance: {
    logo: {
      position: {
        x: number
        y: number
      }
      size: number
      visible: boolean
    }
    nsfw: boolean
  }
}

export interface gameCollectionDocs {
  [gameCollectionId: string]: gameCollectionDoc
}

export interface gameCollectionDoc {
  _id: string
  name: string
  sort: number
  games: string[]
}

export interface gameLocalDocs {
  [gameId: string]: gameLocalDoc
}

export interface gameLocalDoc {
  _id: string
  path: {
    gamePath: string
    savePaths: string[]
  }
  launcher: {
    mode: 'file' | 'url' | 'script'
    fileConfig: {
      path: string
      workingDirectory: string
      args: string[]
      monitorMode: 'file' | 'folder' | 'process'
      monitorPath: string
    }
    urlConfig: {
      url: string
      browserPath: string
      monitorMode: 'file' | 'folder' | 'process'
      monitorPath: string
    }
    scriptConfig: {
      workingDirectory: string
      command: string[]
      monitorMode: 'file' | 'folder' | 'process'
      monitorPath: string
    }
    useMagpie: boolean
  }
  utils: {
    markPath: string
  }
}

export const DEFAULT_GAME_LOCAL_VALUES: Readonly<gameLocalDoc> = {
  _id: '',
  path: {
    gamePath: '',
    savePaths: []
  },
  launcher: {
    mode: 'file',
    fileConfig: {
      path: '',
      workingDirectory: '',
      args: [],
      monitorMode: 'folder',
      monitorPath: ''
    },
    urlConfig: {
      url: '',
      browserPath: '',
      monitorMode: 'folder',
      monitorPath: ''
    },
    scriptConfig: {
      workingDirectory: '',
      command: [],
      monitorMode: 'folder',
      monitorPath: ''
    },
    useMagpie: false
  },
  utils: {
    markPath: ''
  }
} as const

export const DEFAULT_GAME_COLLECTION_VALUES: Readonly<gameCollectionDoc> = {
  _id: '',
  name: '',
  sort: 0,
  games: []
} as const

export const DEFAULT_GAME_VALUES: Readonly<gameDoc> = {
  _id: '',
  metadata: {
    name: '',
    originalName: '',
    releaseDate: '',
    description: '',
    developers: [] as string[],
    publishers: [] as string[],
    platforms: [] as string[],
    genres: [] as string[],
    tags: [] as string[],
    relatedSites: [] as { label: string; url: string }[],
    steamId: '',
    vndbId: '',
    igdbId: '',
    ymgalId: '',
    extra: [] as { key: string; value: string[] }[]
  },
  record: {
    addDate: '',
    lastRunDate: '',
    score: -1,
    playTime: 0,
    playStatus: 'unplayed',
    timers: []
  },
  save: {
    saveList: {},
    maxBackups: 7
  },
  memory: {
    memoryList: {}
  },
  apperance: {
    logo: {
      position: {
        x: 1.5,
        y: 24
      },
      size: 100,
      visible: true
    },
    nsfw: false
  }
} as const

export interface SortConfig {
  by: Paths<gameDoc, { bracketNotation: true }>
  order?: 'asc' | 'desc'
}

export interface Timer {
  start: string
  end: string
}

export interface MaxPlayTimeDay {
  date: string
  playTime: number
}

export const METADATA_EXTRA_PREDEFINED_KEYS = [
  'director',
  'scenario',
  'illustration',
  'music',
  'engine'
]

export interface BatchGameInfo {
  dataId: string
  dataSource: string
  name: string
  id: string
  status: 'idle' | 'loading' | 'success' | 'error' | 'existed'
  dirPath: string
}

export interface Timer {
  start: string
  end: string
}
