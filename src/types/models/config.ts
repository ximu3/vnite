export enum NSFWBlurLevel {
  Off = 0,
  BlurImage = 1,
  BlurImageAndTitle = 2,
  HideGame = 3 // TODO: reserved for future implementation
}
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
      showAllGamesInGroup: boolean
      showCollapseButton: boolean
      playingStatusOrder: string[]
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
    gameDetail: {
      headerLayout: 'default' | 'compact'
      glassBackgroundImage: 'background' | 'cover' | 'logo'
      showHeaderImage: boolean
      headerImageMaxHeight: number
      showCover: boolean
      showLogo: boolean
      contentTopPadding: number
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
    nsfwBlurLevel: NSFWBlurLevel
    fonts: {
      family: string
      size: number
      weight: number
    }
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
  memory: {
    image: {
      storageBackend: 'filesystem' | 'database' | 'both'
      saveDir: string
      namingRule: string
    }
    snippingMode: 'rectangle' | 'activewindow' | 'fullscreen'
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
  hotkeys: {
    capture: string
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
          targetCollection: string
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
      showAllGamesInGroup: true,
      showCollapseButton: true,
      playingStatusOrder: ['unplayed', 'playing', 'finished', 'multiple', 'shelved']
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
      customBackground: true
    },
    showcase: {
      showPlayButtonOnPoster: true
    },
    gameDetail: {
      headerLayout: 'default',
      glassBackgroundImage: 'background',
      showHeaderImage: true,
      headerImageMaxHeight: 55, // in vh
      showCover: true,
      showLogo: true,
      contentTopPadding: 40 // in vh
    },
    glass: {
      dark: {
        blur: 130,
        opacity: 0.3
      },
      light: {
        blur: 130,
        opacity: 0.9
      }
    },
    nsfwBlurLevel: NSFWBlurLevel.Off,
    fonts: {
      family: 'LXGW WenKai Mono',
      size: 1, // in rem
      weight: 400
    }
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
  },
  memory: {
    image: {
      storageBackend: 'database',
      saveDir: '',
      namingRule: '%datetime%'
    },
    snippingMode: 'rectangle'
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
  hotkeys: {
    capture: 'alt+shift+z'
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
          targetCollection: string
        }
      }
    }
  }
} as const
