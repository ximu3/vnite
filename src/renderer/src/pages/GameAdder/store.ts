import i18next from 'i18next'
import { toast } from 'sonner'
import { create } from 'zustand'
import { ipcManager } from '~/app/ipc'
import { useConfigStore } from '~/stores'

export type DataSource = 'vndb' | 'igdb' | 'steam' | 'bangumi' | 'ymgal' | 'dlsite' | string

export type GameList = {
  id: string
  name: string
  releaseDate: string
  developers: string[]
}[]

export type GameAdderPage = 'search' | 'review' | 'backgrounds'

export interface GameAdderDraft {
  dbId: string
  name: string
  dataSource: DataSource
  dataSourceId: string
  dirPath: string
  gamePath: string
  backgroundUrl: string
  enableUpscale: boolean
}

type InitialGame = Partial<Pick<GameAdderDraft, 'dbId' | 'name' | 'dirPath' | 'gamePath'>>

interface GameAdderSession {
  isOpen: boolean
  currentPage: GameAdderPage
  pending: boolean
  draft: GameAdderDraft
  gameList: GameList
  backgroundList: string[]
  reviewIds: string[]
  providers: { id: string; name: string }[] | null
}

export interface GameAdderState extends GameAdderSession {
  open: (game?: InitialGame) => Promise<void>
  close: () => void
  updateDraft: (patch: Partial<Omit<GameAdderDraft, 'dbId'>>) => void
  selectGame: (game: GameList[number]) => void
  goTo: (page: GameAdderPage) => void
}

function emptySession(): GameAdderSession {
  return {
    isOpen: false,
    currentPage: 'search',
    pending: false,
    draft: {
      dbId: '',
      name: '',
      dataSource: 'steam',
      dataSourceId: '',
      dirPath: '',
      gamePath: '',
      backgroundUrl: '',
      enableUpscale: false
    },
    gameList: [],
    backgroundList: [],
    reviewIds: [],
    providers: null
  }
}

export const useGameAdderStore = create<GameAdderState>((set, get) => ({
  ...emptySession(),
  open: async (game = {}): Promise<void> => {
    // Reopening an active dialog must not discard its draft.
    if (get().isOpen) return
    const session = emptySession()
    const dataSource = useConfigStore
      .getState()
      .getConfigValue('game.scraper.common.defaultDataSource')
    set({
      ...session,
      isOpen: true,
      draft: {
        ...session.draft,
        dataSource,
        ...game
      }
    })
    try {
      const providers = await ipcManager.invoke('scraper:get-provider-infos-with-capabilities', [
        'searchGames',
        'checkGameExists',
        'getGameMetadata',
        'getGameBackgrounds',
        'getGameCovers'
      ])
      set({ providers })
      const { draft, updateDraft } = get()
      // Fall back to an available provider, preserving the no-source option for new games.
      if (
        (draft.dataSource !== 'none' || draft.dbId) &&
        providers.length &&
        !providers.some((provider) => provider.id === draft.dataSource)
      ) {
        updateDraft({ dataSource: providers[0].id })
      }
    } catch (error) {
      set({ providers: [] })
      toast.error(
        i18next.t('adder:gameAdder.search.notifications.searchError', {
          message: error instanceof Error ? error.message : String(error)
        })
      )
    }
  },
  close: (): void => {
    set(emptySession())
  },
  goTo: (page): void => {
    set({ currentPage: page })
  },
  updateDraft: (patch): void => {
    const state = get()
    if (!state.isOpen) return
    if (
      (Object.keys(patch) as (keyof typeof patch)[]).every((key) => state.draft[key] === patch[key])
    )
      return

    const draft = { ...state.draft, ...patch }
    const sourceChanged = draft.dataSource !== state.draft.dataSource
    if (sourceChanged) draft.dataSourceId = patch.dataSourceId ?? ''
    // Search results belong to the selected data source.
    set({
      draft,
      ...(sourceChanged ? { gameList: [] } : {})
    })
  },
  selectGame: (game): void => {
    get().updateDraft({ dataSourceId: game.id, name: game.name })
  }
}))
