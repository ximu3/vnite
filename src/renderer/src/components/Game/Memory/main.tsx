import i18next from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sanitizeFilenameComponent } from '@appUtils'
import { Button } from '@ui/button'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { eventBus } from '~/app/events'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState, useConfigState, useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { DEFAULT_MEMORY_PAGE_BY_VIEW, useGameDetailStore, useGameDetailTabStore } from '../store'
import { MemoryCropDialogHost } from './components/MemoryCropDialogHost'
import { MemoryNoteDialogHost } from './components/MemoryNoteDialogHost'
import { MemoryPaginationBar } from './components/MemoryPaginationBar'
import { useMemoryStore } from './store'
import type { MemoryViewItem } from './type'
import { MEMORY_ITEMS_PER_PAGE_OPTIONS, type MemoryViewMode } from './type'
import { useMemoryViewRuntime } from './useMemoryViewRuntime'
import { MemoryCardView } from './view/MemoryCardView'
import { MemoryFullView } from './view/MemoryFullView'
import { MemoryListView } from './view/MemoryListView'
import { MemoryMasonryView } from './view/MemoryMasonryView'

function getTotalPages(itemCount: number, itemsPerPage: number): number {
  return Math.max(1, Math.ceil(itemCount / itemsPerPage))
}

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), totalPages)
}

function paginateMemoryItems(
  memoryItems: MemoryViewItem[],
  page: number,
  itemsPerPage: number
): MemoryViewItem[] {
  const startIndex = (page - 1) * itemsPerPage
  return memoryItems.slice(startIndex, startIndex + itemsPerPage)
}

type ViewPaginationState = {
  currentPage: number
  totalPages: number
  itemCount: number
  itemsPerPage: number
  pagedItems: MemoryViewItem[]
  setItemsPerPage: (itemsPerPage: number) => Promise<void>
}

export function Memory({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [memoryList, , , setMemoryListAndSave] = useGameState(gameId, 'memory.memoryList', true)
  const [pendingNoteMemoryId, setPendingNoteMemoryId] = useState<string | null>(null)
  const [coverHeightRatioRefreshKey, setCoverHeightRatioRefreshKey] = useState(0)
  const [hasLoadedCoverHeightRatios, setHasLoadedCoverHeightRatios] = useState(false)
  const [coverHeightRatioByMemoryId, setCoverHeightRatioByMemoryId] = useState<
    Record<string, number>
  >({})

  const [screenshotPath] = useGameLocalState(gameId, 'path.screenshotPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [rootSaveDir] = useConfigLocalState('memory.image.saveDir')
  const [memorySortOrder, setMemorySortOrder] = useConfigState('appearances.memory.sortOrder')
  const [gridColumnWidth] = useConfigState('appearances.memory.gridColumnWidth')
  const [masonryColumnWidth] = useConfigState('appearances.memory.masonryColumnWidth')
  const [fullColumnWidth] = useConfigState('appearances.memory.fullColumnWidth')
  const [showAddCoverHoverButton] = useConfigState('appearances.memory.showAddCoverHoverButton')
  const [showAddNoteHoverButton] = useConfigState('appearances.memory.showAddNoteHoverButton')
  const [gridItemsPerPage, setGridItemsPerPage] = useConfigState(
    'appearances.memory.gridItemsPerPage'
  )
  const [masonryItemsPerPage, setMasonryItemsPerPage] = useConfigState(
    'appearances.memory.masonryItemsPerPage'
  )
  const [listItemsPerPage, setListItemsPerPage] = useConfigState(
    'appearances.memory.listItemsPerPage'
  )
  const [fullItemsPerPage, setFullItemsPerPage] = useConfigState(
    'appearances.memory.fullItemsPerPage'
  )
  const pageByView = useGameDetailStore(
    (state) => state.memoryPageByGameId[gameId] ?? DEFAULT_MEMORY_PAGE_BY_VIEW
  )
  const setMemoryPageByView = useGameDetailStore((state) => state.setMemoryPageByView)
  const viewMode = useGameDetailTabStore((state) => state.lastMemoryViewMode)
  const setLastMemoryViewMode = useGameDetailTabStore((state) => state.setLastMemoryViewMode)
  const openNoteDialog = useMemoryStore((state) => state.openNoteDialog)

  async function addMemory(): Promise<void> {
    try {
      const memory = await ipcManager.invoke('game:add-memory', gameId)
      setMemoryPageByView(gameId, viewMode, 1)

      if (viewMode === 'masonry') {
        await viewRuntime.selectCover(memory._id)
        return
      }

      if (viewMode === 'list') {
        setPendingNoteMemoryId(memory._id)
      }
    } catch (error) {
      toast.error(t('detail.memory.notifications.createError', { error }))
    }
  }

  async function openScreenshotDir(): Promise<void> {
    if (screenshotPath) {
      await ipcManager.invoke('system:open-path-in-explorer', screenshotPath)
      return
    }

    //* Try to use the default path which will be created in some configurations.
    if (rootSaveDir) {
      const sanitizedName = sanitizeFilenameComponent(gameName)
      const candidatePaths = [window.api.path.join(rootSaveDir, sanitizedName), rootSaveDir]

      for (const path of candidatePaths) {
        const [exists] = await ipcManager.invoke('system:check-if-path-exist', [path])

        if (exists) {
          await ipcManager.invoke('system:open-path-in-explorer', path)
          return
        }
      }
    }
    toast.error(t('detail.memory.notifications.screenshotPathNotSet'))
  }

  const sortedMemoryIds = useMemo(() => {
    return Object.keys(memoryList)
      .filter((id) => memoryList[id] && memoryList[id].date) // Filter out invalid data
      .sort((a, b) => {
        const pinnedOrder =
          Number(Boolean(memoryList[b].pinned)) - Number(Boolean(memoryList[a].pinned))
        const dateOrder =
          memorySortOrder === 'asc'
            ? memoryList[a].date.localeCompare(memoryList[b].date)
            : memoryList[b].date.localeCompare(memoryList[a].date)

        return pinnedOrder || dateOrder || a.localeCompare(b)
      })
  }, [memoryList, memorySortOrder])

  const sortedMemoryItems = useMemo(() => {
    return sortedMemoryIds.map((memoryId) => {
      const memory = memoryList[memoryId]

      return {
        memoryId,
        date: memory.date,
        note: memory.note ?? '',
        pinned: Boolean(memory.pinned),
        coverHeightRatio: coverHeightRatioByMemoryId[memoryId]
      }
    })
  }, [coverHeightRatioByMemoryId, memoryList, sortedMemoryIds])

  const noteMemoryItems = useMemo(() => {
    return sortedMemoryItems.filter((item) => Boolean(item.note.trim()))
  }, [sortedMemoryItems])

  const masonryMemoryItems = useMemo(() => {
    return sortedMemoryItems.filter(
      (item) => item.coverHeightRatio !== undefined && item.coverHeightRatio > 0
    )
  }, [sortedMemoryItems])

  const viewerMemoryIds = useMemo(
    () => masonryMemoryItems.map((item) => item.memoryId),
    [masonryMemoryItems]
  )

  const viewRuntime = useMemoryViewRuntime({
    gameId,
    memoryList,
    viewerMemoryIds,
    setMemoryListAndSave,
    setCoverHeightRatioByMemoryId
  })

  function getViewPaginationState(mode: MemoryViewMode): ViewPaginationState {
    switch (mode) {
      case 'grid': {
        const totalPages = getTotalPages(sortedMemoryItems.length, gridItemsPerPage)
        const currentPage = clampPage(pageByView.grid, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: sortedMemoryItems.length,
          itemsPerPage: gridItemsPerPage,
          pagedItems: paginateMemoryItems(sortedMemoryItems, currentPage, gridItemsPerPage),
          setItemsPerPage: setGridItemsPerPage
        }
      }
      case 'masonry': {
        const totalPages = getTotalPages(masonryMemoryItems.length, masonryItemsPerPage)
        const currentPage = clampPage(pageByView.masonry, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: masonryMemoryItems.length,
          itemsPerPage: masonryItemsPerPage,
          pagedItems: paginateMemoryItems(masonryMemoryItems, currentPage, masonryItemsPerPage),
          setItemsPerPage: setMasonryItemsPerPage
        }
      }
      case 'list': {
        const totalPages = getTotalPages(noteMemoryItems.length, listItemsPerPage)
        const currentPage = clampPage(pageByView.list, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: noteMemoryItems.length,
          itemsPerPage: listItemsPerPage,
          pagedItems: paginateMemoryItems(noteMemoryItems, currentPage, listItemsPerPage),
          setItemsPerPage: setListItemsPerPage
        }
      }
      case 'full': {
        const totalPages = getTotalPages(sortedMemoryItems.length, fullItemsPerPage)
        const currentPage = clampPage(pageByView.full, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: sortedMemoryItems.length,
          itemsPerPage: fullItemsPerPage,
          pagedItems: paginateMemoryItems(sortedMemoryItems, currentPage, fullItemsPerPage),
          setItemsPerPage: setFullItemsPerPage
        }
      }
    }
  }

  function getTotalPagesForView(mode: MemoryViewMode): number {
    return getViewPaginationState(mode).totalPages
  }

  const activePagination = getViewPaginationState(viewMode)

  // Clamp each view's current page when data size or page size changes.
  useEffect(() => {
    const nextGridPage = clampPage(pageByView.grid, getTotalPagesForView('grid'))
    const nextMasonryPage = clampPage(pageByView.masonry, getTotalPagesForView('masonry'))
    const nextListPage = clampPage(pageByView.list, getTotalPagesForView('list'))
    const nextFullPage = clampPage(pageByView.full, getTotalPagesForView('full'))

    if (nextGridPage !== pageByView.grid) {
      setMemoryPageByView(gameId, 'grid', nextGridPage)
    }

    if (nextMasonryPage !== pageByView.masonry) {
      setMemoryPageByView(gameId, 'masonry', nextMasonryPage)
    }

    if (nextListPage !== pageByView.list) {
      setMemoryPageByView(gameId, 'list', nextListPage)
    }

    if (nextFullPage !== pageByView.full) {
      setMemoryPageByView(gameId, 'full', nextFullPage)
    }
  }, [
    fullItemsPerPage,
    gameId,
    gridItemsPerPage,
    listItemsPerPage,
    masonryItemsPerPage,
    masonryMemoryItems.length,
    noteMemoryItems.length,
    pageByView.grid,
    pageByView.full,
    pageByView.list,
    pageByView.masonry,
    setMemoryPageByView,
    sortedMemoryIds.length
  ])

  // Load cover height ratios used by both the gallery layout and grid cards.
  useEffect(() => {
    let cancelled = false

    async function loadMemoryCoverHeightRatios(): Promise<void> {
      if (sortedMemoryIds.length === 0) {
        setCoverHeightRatioByMemoryId({})
        setHasLoadedCoverHeightRatios(true)
        return
      }

      setHasLoadedCoverHeightRatios(false)

      try {
        const masonryItems = await ipcManager.invoke(
          'game:get-memory-masonry-items',
          gameId,
          sortedMemoryIds
        )
        const nextCoverHeightRatioByMemoryId = Object.fromEntries(
          Object.entries(masonryItems).map(([memoryId, { heightRatio }]) => [memoryId, heightRatio])
        )

        if (cancelled) return
        setCoverHeightRatioByMemoryId(nextCoverHeightRatioByMemoryId)
        setHasLoadedCoverHeightRatios(true)
      } catch (error) {
        if (cancelled) return
        setHasLoadedCoverHeightRatios(true)
        toast.error(i18next.t('game:detail.memory.notifications.getImageError', { error }))
      }
    }

    void loadMemoryCoverHeightRatios()

    return (): void => {
      cancelled = true
    }
  }, [coverHeightRatioRefreshKey, gameId, sortedMemoryIds])

  // Refresh cover height ratios when memory items are created or their covers change.
  useEffect(() => {
    const refreshCoverHeightRatios = ({ gameId: changedGameId }: { gameId: string }): void => {
      if (changedGameId !== gameId) return

      setCoverHeightRatioRefreshKey((current) => current + 1)
    }

    const unsubscribeMemoryCreated = eventBus.on('game:memory-created', refreshCoverHeightRatios)
    const unsubscribeMemoryCoverUpdated = eventBus.on(
      'game:memory-cover-updated',
      refreshCoverHeightRatios
    )

    return (): void => {
      unsubscribeMemoryCreated()
      unsubscribeMemoryCoverUpdated()
    }
  }, [gameId])

  // Open the note editor after the newly created list item has synced back into the store.
  useEffect(() => {
    if (!pendingNoteMemoryId) return
    if (!memoryList[pendingNoteMemoryId]) return

    // Wait for the DB -> store sync to materialize the new memory before opening NoteDialog.
    openNoteDialog({
      memoryId: pendingNoteMemoryId,
      initialMode: 'edit'
    })
    setPendingNoteMemoryId(null)
  }, [memoryList, openNoteDialog, pendingNoteMemoryId])

  async function saveNote(memoryId: string, note: string): Promise<void> {
    const currentMemory = memoryList[memoryId]
    if (!currentMemory) return

    const newMemoryList = {
      ...memoryList,
      [memoryId]: {
        ...currentMemory,
        note
      }
    }
    await setMemoryListAndSave(newMemoryList)
  }

  function toggleMemorySortOrder(): void {
    void setMemorySortOrder(memorySortOrder === 'asc' ? 'desc' : 'asc')

    for (const mode of ['grid', 'masonry', 'list', 'full'] as const) {
      setMemoryPageByView(gameId, mode, 1)
    }
  }

  function renderEmptyState(): React.JSX.Element {
    return (
      <div
        className={cn('flex min-h-32 items-center justify-center text-sm text-muted-foreground')}
      >
        {t('detail.memory.empty')}
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full min-h-[22vh] flex flex-col pt-2 gap-5')}>
      <div className={cn('flex items-center gap-3')}>
        <div className={cn('flex items-center gap-3')}>
          <Button variant="default" size="icon" onClick={addMemory}>
            <span className={cn('icon-[mdi--add] w-6 h-6')}></span>
          </Button>
          <Button variant="secondary" onClick={openScreenshotDir}>
            {t('detail.memory.actions.openScreenshotDir')}
          </Button>
        </div>

        <div className={cn('min-w-0 flex-1')}>
          {activePagination.itemCount > 0 && (
            <MemoryPaginationBar
              currentPage={activePagination.currentPage}
              totalPages={activePagination.totalPages}
              itemsPerPage={activePagination.itemsPerPage}
              itemsPerPageOptions={MEMORY_ITEMS_PER_PAGE_OPTIONS[viewMode]}
              onPageChange={(page) => {
                setMemoryPageByView(gameId, viewMode, page)
              }}
              onItemsPerPageChange={(itemsPerPage) => {
                void activePagination.setItemsPerPage(itemsPerPage)
              }}
            />
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('size-8 shrink-0')}
          onClick={toggleMemorySortOrder}
        >
          <span
            className={cn(
              memorySortOrder === 'asc' ? 'icon-[mdi--arrow-up]' : 'icon-[mdi--arrow-down]',
              'size-4'
            )}
          />
        </Button>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setLastMemoryViewMode(v as MemoryViewMode)}
          className={cn('shrink-0')}
        >
          <TabsList className={cn('gap-1')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('inline-flex')}>
                  <TabsTrigger value="grid" className={cn('size-8 px-0 py-0')}>
                    <span className={cn('icon-[mdi--view-grid-outline] size-4')} />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('detail.memory.views.grid')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('inline-flex')}>
                  <TabsTrigger value="full" className={cn('size-8 px-0 py-0')}>
                    <span className={cn('icon-[mdi--post-outline] size-4')} />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('detail.memory.views.full')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('inline-flex')}>
                  <TabsTrigger value="masonry" className={cn('size-8 px-0 py-0')}>
                    <span className={cn('icon-[mdi--collage] size-4')} />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('detail.memory.views.masonry')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('inline-flex')}>
                  <TabsTrigger value="list" className={cn('size-8 px-0 py-0')}>
                    <span className={cn('icon-[mdi--format-list-bulleted] size-4')} />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('detail.memory.views.list')}</TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>
      </div>
      {viewMode === 'grid' && sortedMemoryItems.length === 0 && renderEmptyState()}
      {viewMode === 'grid' && sortedMemoryItems.length > 0 && (
        <MemoryCardView
          items={activePagination.pagedItems}
          runtime={viewRuntime}
          columnWidth={gridColumnWidth}
          showAddCoverHoverButton={showAddCoverHoverButton}
          showAddNoteHoverButton={showAddNoteHoverButton}
        />
      )}
      {viewMode === 'masonry' &&
        hasLoadedCoverHeightRatios &&
        masonryMemoryItems.length === 0 &&
        renderEmptyState()}
      {viewMode === 'masonry' && masonryMemoryItems.length > 0 && (
        <MemoryMasonryView
          items={activePagination.pagedItems}
          runtime={viewRuntime}
          columnWidth={masonryColumnWidth}
        />
      )}
      {viewMode === 'list' && noteMemoryItems.length === 0 && renderEmptyState()}
      {viewMode === 'list' && noteMemoryItems.length > 0 && (
        <MemoryListView items={activePagination.pagedItems} runtime={viewRuntime} />
      )}
      {viewMode === 'full' && sortedMemoryItems.length === 0 && renderEmptyState()}
      {viewMode === 'full' && sortedMemoryItems.length > 0 && (
        <MemoryFullView
          items={activePagination.pagedItems}
          runtime={viewRuntime}
          columnWidth={fullColumnWidth}
          showAddCoverHoverButton={showAddCoverHoverButton}
          showAddNoteHoverButton={showAddNoteHoverButton}
        />
      )}
      <MemoryCropDialogHost />
      <MemoryNoteDialogHost gameId={gameId} memoryList={memoryList} saveNote={saveNote} />
    </div>
  )
}
