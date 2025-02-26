export interface configDocs {
  general: {
    openAtLogin: boolean
    quitToTray: boolean
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
  sync: {
    enabled: boolean
    mode: 'offical' | 'selfHosted'
    officalConfig: {
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

export const DEFAULT_CONFIG_VALUES = {
  general: {
    openAtLogin: false,
    quitToTray: true
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
} satisfies configDocs

export const DEFAULT_CONFIG_LOCAL_VALUES = {
  sync: {
    enabled: true,
    mode: 'offical',
    officalConfig: {
      auth: {
        username: 'ximu',
        password: 'S%3WcHlrlA^PUl'
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
} satisfies configLocalDocs
