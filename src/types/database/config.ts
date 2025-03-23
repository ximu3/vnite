export interface configDocs {
  general: {
    openAtLogin: boolean
    quitToTray: boolean
    language: string
  }
  game: {
    scraper: {
      defaultDatasSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb'
    }
    showcase: {
      sort: {
        by:
          | 'metadata.name'
          | 'metadata.releaseDate'
          | 'record.lastRunDate'
          | 'record.addDate'
          | 'record.playTime'
        order: 'asc' | 'desc'
      }
    }
    gameList: {
      sort: {
        by:
          | 'metadata.name'
          | 'metadata.releaseDate'
          | 'record.lastRunDate'
          | 'record.addDate'
          | 'record.playTime'
        order: 'asc' | 'desc'
      }
      selectedGroup: 'collection' | 'developers' | 'genres'
      highlightLocalGames: boolean
      markLocalGames: boolean
      showRecentGames: boolean
      playingStatusOrder: string[]
    }
    gameHeader: {
      showOriginalName: boolean
    }
  }
  appearances: {
    sidebar: {
      showThemeSwitcher: boolean
    }
  }
}

export interface configLocalDocs {
  userInfo: {
    name: string
    email: string
    role: string
    accessToken: string
    refreshToken: string
  }
  sync: {
    enabled: boolean
    mode: 'official' | 'selfHosted'
    officialConfig: {
      auth: {
        username: string
        password: string
      }
    }
    selfHostedConfig: {
      url: string
      auth: {
        username: string
        password: string
      }
    }
  }
  game: {
    linkage: {
      localeEmulator: {
        path: string
      }
      visualBoyAdvance: {
        path: string
      }
      magpie: {
        path: string
        hotkey: string
      }
    }
  }
}

export const DEFAULT_CONFIG_VALUES: Readonly<configDocs> = {
  general: {
    openAtLogin: false,
    quitToTray: false,
    language: ''
  },
  game: {
    scraper: {
      defaultDatasSource: 'steam'
    },
    showcase: {
      sort: {
        by: 'metadata.name',
        order: 'desc' as const
      }
    },
    gameList: {
      sort: {
        by: 'metadata.name',
        order: 'desc' as const
      },
      selectedGroup: 'collection',
      highlightLocalGames: true,
      markLocalGames: false,
      showRecentGames: true,
      playingStatusOrder: ['unplayed', 'playing', 'finished', 'multiple', 'shelved']
    },
    gameHeader: {
      showOriginalName: false
    }
  },
  appearances: {
    sidebar: {
      showThemeSwitcher: true
    }
  }
} as const

export const DEFAULT_CONFIG_LOCAL_VALUES: Readonly<configLocalDocs> = {
  userInfo: {
    name: '',
    email: '',
    role: 'community',
    accessToken: '',
    refreshToken: ''
  },
  sync: {
    enabled: false,
    mode: 'official',
    officialConfig: {
      auth: {
        username: '',
        password: ''
      }
    },
    selfHostedConfig: {
      url: '',
      auth: {
        username: '',
        password: ''
      }
    }
  },
  game: {
    linkage: {
      localeEmulator: {
        path: ''
      },
      visualBoyAdvance: {
        path: ''
      },
      magpie: {
        path: '',
        hotkey: 'win+shift+a'
      }
    }
  }
} as const
