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
    platforms: string[]
    publishers: string[]
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
  }
}

export interface gameCollectionDocs {
  [gameCollectionId: string]: gameCollectionDoc
}

export interface gameCollectionDoc {
  _id: string
  name: string
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
}

export const DEFAULT_GAME_LOCAL_VALUES = {
  _id: '',
  path: {
    gamePath: '',
    savePaths: [],
    maxSaveBackups: 7
  },
  launcher: {
    mode: 'file',
    fileConfig: {
      path: '',
      workingDirectory: '',
      args: []
    },
    urlConfig: {
      url: '',
      browserPath: ''
    },
    scriptConfig: {
      workingDirectory: '',
      command: []
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
  }
} satisfies gameLocalDoc

export const DEFAULT_GAME_COLLECTION_VALUES = {
  _id: '',
  name: '',
  games: []
} satisfies gameCollectionDoc

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
    relatedSites: [] as { label: string; url: string }[],
    steamId: '',
    vndbId: '',
    igdbId: '',
    ymgalId: ''
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
    saveList: {}
  },
  memory: {
    memoryList: {}
  },
  apperance: {
    logo: {
      position: {
        x: 2,
        y: 29
      },
      size: 100,
      visible: true
    }
  }
} satisfies gameDoc

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
