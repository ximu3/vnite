import { Paths } from 'type-fest'

export type gameDocs = {
  [K in Exclude<string, 'collections'>]: gameDoc
} & {
  collections: gameCollectionDoc
}

export interface gameDoc {
  _id: string
  metadata: {
    name: string
    originalName: string
    releaseDate: string
    description: string
    developers: string[]
    platforms: string[]
    publishers: string[]
    genres: string[]
    tags: string[]
    steamId: string
    vndbId: string
    igdbId: string
    ymgalId: string
  }
  path: {
    gamePath: string
    savePaths: string[]
    maxSaveBackups: number
  }
  launcher: {
    mode: 'file' | 'url' | 'script'
    fileConfig: {
      path: string
      workingDirectory: string
      args: string[]
    }
    urlConfig: {
      url: string
      browserPath: string
    }
    scriptConfig: {
      workingDirectory: string
      command: string[]
    }
    useMagpie: boolean
  }
  monitor: {
    mode: 'file' | 'folder' | 'process'
    fileConfig: {
      path: string
    }
    folderConfig: {
      path: string
      deepth: number
    }
    processConfig: {
      name: string
    }
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
    [saveId: string]: {
      _id: string
      date: string
      note: string
      locked: boolean
    }
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
}

export interface gameCollectionDoc {
  [gameCollectionId: string]: gameCollection
}

export interface gameCollection {
  id: string
  name: string
  games: gameDoc[]
}

export const DEFAULT_GAME_VALUES = {
  _id: '',
  metadata: {
    name: '',
    originalName: '',
    releaseDate: '',
    description: '',
    developers: [] as string[],
    platforms: [] as string[],
    publishers: [] as string[],
    genres: [] as string[],
    tags: [] as string[],
    steamId: '',
    vndbId: '',
    igdbId: '',
    ymgalId: ''
  },
  path: {
    gamePath: '',
    savePaths: [] as string[],
    maxSaveBackups: 7
  },
  launcher: {
    mode: 'file',
    fileConfig: {
      path: '',
      workingDirectory: '',
      args: [] as string[]
    },
    urlConfig: {
      url: '',
      browserPath: ''
    },
    scriptConfig: {
      workingDirectory: '',
      command: [] as string[]
    },
    useMagpie: false
  },
  monitor: {
    mode: 'file',
    fileConfig: {
      path: ''
    },
    folderConfig: {
      path: '',
      deepth: 3
    },
    processConfig: {
      name: ''
    }
  },
  record: {
    addDate: '',
    lastRunDate: '',
    score: -1,
    playTime: 0,
    playStatus: 'unplayed',
    timers: []
  },
  save: {},
  memory: {
    memoryList: {}
  }
} satisfies gameDoc

export interface SortConfig {
  by: Paths<gameDoc, { bracketNotation: true }>
  order?: 'asc' | 'desc'
}
