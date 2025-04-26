export interface configDocs {
  general: {
    openAtLogin: boolean
    quitToTray: boolean
    language: string
  }
  game: {
    scraper: {
      defaultDatasSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite'
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
      selectedGroup:
        | 'none'
        | 'collection'
        | 'metadata.genres'
        | 'metadata.developers'
        | 'record.playStatus'
      highlightLocalGames: boolean
      markLocalGames: boolean
      showRecentGames: boolean
      playingStatusOrder: string[]
      playStatusAccordionOpen: string[]
      allGamesAccordionOpen: boolean
      recentGamesAccordionOpen: boolean
    }
    gameHeader: {
      showOriginalName: boolean
    }
  }
  appearances: {
    sidebar: {
      showThemeSwitcher: boolean
    }
    background: {
      customBackground: boolean
    }
    glass: {
      blur: number
      opacity: number
    }
  }
  hotkeys: {
    library: string
    record: string
    scanner: string
    config: string
    addGame: string
    randomGame: string
  }
  updater: {
    allowPrerelease: boolean
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
    scanner: {
      interval: number
      ignoreList: string[]
      list: {
        [key: string]: {
          path: string
          dataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite'
          depth: number
        }
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
      playingStatusOrder: ['unplayed', 'playing', 'finished', 'multiple', 'shelved'],
      playStatusAccordionOpen: ['unplayed', 'playing', 'finished', 'multiple', 'shelved'],
      allGamesAccordionOpen: true,
      recentGamesAccordionOpen: true
    },
    gameHeader: {
      showOriginalName: false
    }
  },
  appearances: {
    sidebar: {
      showThemeSwitcher: true
    },
    background: {
      customBackground: false
    },
    glass: {
      blur: 64,
      opacity: 0.85
    }
  },
  hotkeys: {
    library: 'ctrl+l',
    record: 'ctrl+r',
    scanner: 'ctrl+s',
    config: 'ctrl+c',
    addGame: 'ctrl+a',
    randomGame: 'ctrl+shift+r'
  },
  updater: {
    allowPrerelease: false
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
    },
    scanner: {
      interval: 15 * 60 * 1000,
      ignoreList: [],
      list: {} as {
        [key: string]: {
          path: string
          dataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite'
          depth: number
        }
      }
    }
  }
} as const
