export interface configDocs {
  general: {
    openAtLogin: boolean
    quitToTray: boolean
  }
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
    scraper: {
      defaultDatasSource: string
    }
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
    showcase: {
      sort: {
        by: string
        order: 'asc' | 'desc'
      }
    }
    gameList: {
      sort: {
        by: string
        order: 'asc' | 'desc'
      }
      selectedGroup: string
      highlightLocalGames: boolean
      markLocalGames: boolean
      showRecentGames: boolean
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

export const DEFAULT_CONFIG_VALUES = {
  general: {
    openAtLogin: false,
    quitToTray: true
  },
  sync: {
    enabled: true,
    mode: 'offical',
    officalConfig: {
      auth: {
        username: 'ximu',
        password: '001500szm'
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
    scraper: {
      defaultDatasSource: 'steam'
    },
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
    showcase: {
      sort: {
        by: 'name',
        order: 'desc' as const
      }
    },
    gameList: {
      sort: {
        by: 'name',
        order: 'desc' as const
      },
      selectedGroup: 'all',
      highlightLocalGames: true,
      markLocalGames: false,
      showRecentGames: true
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
