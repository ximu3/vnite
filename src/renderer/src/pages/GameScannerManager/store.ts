import { create } from 'zustand'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { toast } from 'sonner'
import { OverallScanProgress } from '@appTypes/utils'
import { generateUUID } from '@appUtils'
import { useConfigLocalStore } from '~/stores'
import i18next from 'i18next'

interface FailedFolder {
  path: string
  name: string
  error: string
  dataSource?: string
}

interface ScannerForm {
  path: string
  dataSource: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite'
  depth: number
}

interface GlobalScannerSettings {
  interval: number
  ignoreList: string[]
}

interface GameScannerStore {
  // State
  editingScanner: { id: string | null; isNew: boolean } | null
  scanProgress: OverallScanProgress
  isShowingFailedDialog: boolean
  selectedFailedFolder: FailedFolder | null
  searchResults: any[]
  searchTerm: string
  isSearching: boolean
  formState: ScannerForm
  globalSettings: GlobalScannerSettings
  intervalMinutes: string

  // Initialization
  initialize: () => Promise<void>

  // Scanner Management Operations
  setEditingScanner: (scanner: { id: string | null; isNew: boolean } | null) => void
  showFailedDialog: (show: boolean) => void

  // Scanning Operations
  scanAll: () => Promise<void>
  scanScanner: (scannerId: string) => Promise<void>
  stopScan: () => Promise<void>

  // Failed Folder Handling
  selectFailedFolder: (folder: FailedFolder | null) => void
  selectGame: (gameId: string) => Promise<void>

  // Edit Scanner Operations
  initFormState: (
    scanner: any | null,
    isNew: boolean,
    globalSettings?: GlobalScannerSettings
  ) => void
  updateFormState: (updates: Partial<ScannerForm>) => void
  updateGlobalSettings: (updates: Partial<GlobalScannerSettings>) => void
  updateIntervalMinutes: (minutes: string) => void
  selectPath: () => Promise<void>
  createNewScanner: (config: ScannerForm) => Promise<string>

  fixFailedFolder: (folderPath: string, gameId: string, dataSource: string) => Promise<void>
  ignoreFailedFolder: (scannerId: string, folderPath: string) => Promise<void>
}

const t = (key: string): string => i18next.t(key, { ns: 'scanner' })

export const useGameScannerStore = create<GameScannerStore>((set, get) => ({
  // Initial State
  editingScanner: null,
  scanProgress: {
    status: 'idle',
    currentScannerId: '',
    processedScanners: 0,
    totalScanners: 0,
    scannersToProcess: [],
    scannedGames: 0,
    scannerProgresses: {}
  },
  isShowingScanDialog: false,
  isShowingFailedDialog: false,
  selectedFailedFolder: null,
  searchResults: [],
  searchTerm: '',
  isSearching: false,
  formState: {
    path: '',
    dataSource: 'steam',
    depth: 1
  },
  globalSettings: {
    interval: 0,
    ignoreList: []
  },
  intervalMinutes: '0',

  // Initialization - Set Event Listeners
  initialize: async (): Promise<void> => {
    // Get initial scan status
    const progress = (await ipcInvoke('game-scanner:get-progress')) as OverallScanProgress
    if (progress) {
      set({
        scanProgress: progress.status !== undefined ? progress : get().scanProgress
      })
    }

    // Get global scanner settings
    const scannerConfig = useConfigLocalStore.getState().getConfigLocalValue('game.scanner')
    if (scannerConfig) {
      set({
        globalSettings: {
          interval: scannerConfig.interval || 0,
          ignoreList: scannerConfig.ignoreList || []
        },
        intervalMinutes: ((scannerConfig.interval || 0) / 60000).toString()
      })
    }

    // Set up all IPC listeners
    ipcOnUnique('game-scanner:scan-progress', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-completed', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-error', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-paused', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-resumed', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-stopped', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-folder-error', (_, progress) => {
      set({ scanProgress: progress })
    })

    ipcOnUnique('game-scanner:scan-folder-fixed', (_, progress) => {
      set({ scanProgress: progress })
    })
  },

  // UI State Operations
  setEditingScanner: (scanner): void => set({ editingScanner: scanner }),
  showFailedDialog: (show): void => set({ isShowingFailedDialog: show }),

  // Scanning Operations
  scanAll: async (): Promise<void> => {
    const progress = (await ipcInvoke('game-scanner:scan-all')) as OverallScanProgress
    set({ scanProgress: progress })
  },

  scanScanner: async (scannerId): Promise<void> => {
    await ipcInvoke('game-scanner:scan-scanner', scannerId)
  },

  stopScan: async (): Promise<void> => {
    const progress = (await ipcInvoke('game-scanner:stop-scan')) as OverallScanProgress
    set({ scanProgress: progress })
  },

  // Failed Folder Handling
  selectFailedFolder: (folder): void => {
    set({
      selectedFailedFolder: folder,
      searchTerm: folder?.name || '',
      searchResults: []
    })
  },

  selectGame: async (gameId): Promise<void> => {
    const { selectedFailedFolder } = get()
    if (!selectedFailedFolder) return

    try {
      const dataSource = selectedFailedFolder.dataSource || 'steam'
      await ipcInvoke('game-scanner:fix-folder', selectedFailedFolder.path, gameId, dataSource)

      // Reset state
      set({
        selectedFailedFolder: null,
        searchResults: [],
        searchTerm: ''
      })
    } catch (error) {
      console.error(`${t('errors.fixFolder')}`, error)
    }
  },

  // Edit Scanner Operations
  initFormState: (scanner, isNew): void => {
    if (!isNew && scanner) {
      set({
        formState: {
          path: scanner.path || '',
          dataSource: scanner.dataSource || 'steam',
          depth: scanner.depth || scanner.deepth || 1
        }
      })
    } else {
      set({
        formState: {
          path: '',
          dataSource: 'steam',
          depth: 1
        }
      })
    }
  },

  updateFormState: (updates): void => {
    set((state) => ({
      formState: { ...state.formState, ...updates }
    }))
  },

  updateGlobalSettings: (updates): void => {
    set((state) => ({
      globalSettings: { ...state.globalSettings, ...updates }
    }))
  },

  updateIntervalMinutes: (minutes): void => {
    const minutesFloat = parseFloat(minutes) || 0
    set({
      intervalMinutes: minutes,
      globalSettings: {
        ...get().globalSettings,
        interval: minutesFloat * 60000 // Convert to milliseconds
      }
    })
  },

  selectPath: async (): Promise<void> => {
    const path = await ipcInvoke('select-path-dialog', ['openDirectory'])
    if (path) {
      set((state) => ({
        formState: { ...state.formState, path: path as string }
      }))
    }
  },

  // Create a new scanner
  createNewScanner: async (config): Promise<string> => {
    try {
      const newId = generateUUID()

      // Get current global scanner configuration
      const scannerConfig = useConfigLocalStore.getState().getConfigLocalValue('game.scanner') || {
        interval: get().globalSettings.interval,
        ignoreList: get().globalSettings.ignoreList,
        list: {}
      }

      // Update scanner list
      const updatedConfig = {
        ...scannerConfig,
        list: {
          ...scannerConfig.list,
          [newId]: config
        }
      }

      // Save updated configuration
      await useConfigLocalStore.getState().setConfigLocalValue('game.scanner', updatedConfig)

      return newId as string
    } catch (error) {
      console.error(`${t('errors.createScanner')}`, error)
      toast.error(t('notifications.createError'))
      throw error
    }
  },

  fixFailedFolder: async (folderPath, gameId, dataSource): Promise<void> => {
    try {
      toast.loading(t('notifications.fixAttempt'), {
        id: 'fix-folder'
      })
      await ipcInvoke('game-scanner:fix-folder', folderPath, gameId, dataSource)

      toast.success(t('notifications.fixSuccess'), {
        id: 'fix-folder'
      })
    } catch (error) {
      console.error(`${t('errors.fixFolder')}`, error)
      toast.error(t('notifications.fixError'), {
        id: 'fix-folder'
      })
      throw error
    }
  },

  ignoreFailedFolder: async (scannerId: string, folderPath: string): Promise<void> => {
    try {
      set((state) => ({
        scanProgress: {
          ...state.scanProgress,
          scannerProgresses: {
            ...state.scanProgress.scannerProgresses,
            [scannerId]: {
              ...state.scanProgress.scannerProgresses[scannerId],
              failedFolders: state.scanProgress.scannerProgresses[scannerId].failedFolders.filter(
                (folder) => folder.path !== folderPath
              )
            }
          }
        }
      }))
      await ipcInvoke('game-scanner:ignore-failed-folder', scannerId, folderPath)
    } catch (error) {
      console.error(`${t('errors.ignoreFolder')}`, error)
    }
  }
}))
