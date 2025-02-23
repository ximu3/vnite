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
