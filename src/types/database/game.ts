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
    savePath: string
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
      id: string
      date: string
      note: string
    }
  }
  memory: {
    memoryList: {
      [memoryId: string]: {
        id: string
        date: string
        note: string
      }
    }
  }
}

export interface gameCollectionDoc {
  [gameCollectionId: string]: {
    id: string
    name: string
    games: string[]
  }
}
