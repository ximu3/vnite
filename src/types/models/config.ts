export interface configDocs {
  general: {
    openAtLogin: boolean
    quitToTray: boolean
    language: string
    hideWindowAfterGameStart: boolean
  }
  game: {
    scraper: {
      common: {
        defaultDataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite' | string
      }
      vndb: {
        tagSpoilerLevel: 0 | 1 | 2
      }
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
      showCollapseButton: boolean
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
      showNSFWBlurSwitcher: boolean
    }
    background: {
      customBackground: boolean
    }
    showcase: {
      showPlayButtonOnPoster: boolean
    }
    glass: {
      dark: {
        blur: number
        opacity: number
      }
      light: {
        blur: number
        opacity: number
      }
    }
    enableNSFWBlur: boolean
    font: string
  }
  hotkeys: {
    library: string
    record: string
    scanner: string
    config: string
    goBack: string
    goForward: string
    addGame: string
    randomGame: string
  }
  updater: {
    allowPrerelease: boolean
  }
  metadata: {
    transformer: {
      enabled: boolean
      list: {
        id: string
        name: string
        note: string
        processors: {
          name: {
            match: string[]
            replace: string
          }[]
          originalName: {
            match: string[]
            replace: string
          }[]
          description: {
            match: string[]
            replace: string
          }[]
          developers: {
            match: string[]
            replace: string
          }[]
          publishers: {
            match: string[]
            replace: string
          }[]
          platforms: {
            match: string[]
            replace: string
          }[]
          genres: {
            match: string[]
            replace: string
          }[]
          tags: {
            match: string[]
            replace: string
          }[]
          director: {
            match: string[]
            replace: string
          }[]
          scenario: {
            match: string[]
            replace: string
          }[]
          illustration: {
            match: string[]
            replace: string
          }[]
          music: {
            match: string[]
            replace: string
          }[]
          engine: {
            match: string[]
            replace: string
          }[]
        }
      }[]
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
    scanner: {
      interval: number
      ignoreList: string[]
      list: {
        [key: string]: {
          path: string
          dataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite' | string
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
    language: '',
    hideWindowAfterGameStart: true
  },
  game: {
    scraper: {
      common: {
        defaultDataSource: 'steam'
      },
      vndb: {
        tagSpoilerLevel: 0
      }
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
      showCollapseButton: true,
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
      showThemeSwitcher: true,
      showNSFWBlurSwitcher: true
    },
    background: {
      customBackground: false
    },
    showcase: {
      showPlayButtonOnPoster: true
    },
    glass: {
      dark: {
        blur: 100,
        opacity: 0.5
      },
      light: {
        blur: 130,
        opacity: 0.8
      }
    },
    enableNSFWBlur: true,
    font: 'LXGW WenKai Mono'
  },
  hotkeys: {
    library: 'alt+shift+l',
    record: 'alt+shift+r',
    scanner: 'alt+shift+s',
    config: 'alt+shift+c',
    goBack: 'alt+left',
    goForward: 'alt+right',
    addGame: 'alt+shift+a',
    randomGame: 'ctrl+shift+r'
  },
  updater: {
    allowPrerelease: false
  },
  metadata: {
    transformer: {
      enabled: true,
      list: [
        {
          id: 'default',
          name: 'Default',
          note: 'Default transformer',
          processors: {
            name: [],
            originalName: [],
            description: [],
            developers: [],
            publishers: [],
            platforms: [],
            genres: [],
            tags: [],
            director: [],
            scenario: [],
            illustration: [],
            music: [],
            engine: []
          }
        }
      ]
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
