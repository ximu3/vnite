import { sanitizeFilenameComponent } from '@appUtils'
import { Button } from '@ui/button'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import i18next from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { eventBus } from '~/app/events'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState, useConfigState, useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { DEFAULT_MEMORY_PAGE_BY_VIEW, useGameDetailStore, useGameDetailTabStore } from '../store'
import { MemoryCardView } from './MemoryCardView'
import { MemoryCropDialogHost } from './MemoryCropDialogHost'
import { MemoryListView } from './MemoryListView'
import { MemoryMasonryItemInfo, MemoryMasonryView } from './MemoryMasonryView'
import { MemoryNoteDialogHost } from './MemoryNoteDialogHost'
import { MemoryPaginationBar } from './MemoryPaginationBar'
import { MEMORY_ITEMS_PER_PAGE_OPTIONS, type MemoryViewMode } from './paginationOptions'
import { useMemoryStore } from './store'

function getTotalPages(itemCount: number, itemsPerPage: number): number {
  return Math.max(1, Math.ceil(itemCount / itemsPerPage))
}

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), totalPages)
}

function paginateMemoryIds(memoryIds: string[], page: number, itemsPerPage: number): string[] {
  const startIndex = (page - 1) * itemsPerPage
  return memoryIds.slice(startIndex, startIndex + itemsPerPage)
}

type ViewPaginationState = {
  currentPage: number
  totalPages: number
  itemCount: number
  itemsPerPage: number
  pagedMemoryIds: string[]
  setItemsPerPage: (itemsPerPage: number) => Promise<void>
}

export function Memory({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [memoryList, , , setMemoryListAndSave] = useGameState(gameId, 'memory.memoryList', true)
  const [pendingNoteMemoryId, setPendingNoteMemoryId] = useState<string | null>(null)
  const [masonryRefreshKey, setMasonryRefreshKey] = useState(0)
  const [hasLoadedMasonryItems, setHasLoadedMasonryItems] = useState(false)
  const [masonryItemByMemoryId, setMasonryItemByMemoryId] = useState<
    Record<string, MemoryMasonryItemInfo>
  >({})

  const [screenshotPath] = useGameLocalState(gameId, 'path.screenshotPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [rootSaveDir] = useConfigLocalState('memory.image.saveDir')
  const [masonryColumnWidth] = useConfigState('appearances.memory.masonryColumnWidth')
  const [gridItemsPerPage, setGridItemsPerPage] = useConfigState(
    'appearances.memory.gridItemsPerPage'
  )
  const [masonryItemsPerPage, setMasonryItemsPerPage] = useConfigState(
    'appearances.memory.masonryItemsPerPage'
  )
  const [listItemsPerPage, setListItemsPerPage] = useConfigState(
    'appearances.memory.listItemsPerPage'
  )
  const pageByView = useGameDetailStore(
    (state) => state.memoryPageByGameId[gameId] ?? DEFAULT_MEMORY_PAGE_BY_VIEW
  )
  const setMemoryPageByView = useGameDetailStore((state) => state.setMemoryPageByView)
  const viewMode = useGameDetailTabStore((state) => state.lastMemoryViewMode)
  const setLastMemoryViewMode = useGameDetailTabStore((state) => state.setLastMemoryViewMode)
  const openCropDialog = useMemoryStore((state) => state.openCropDialog)
  const openNoteDialog = useMemoryStore((state) => state.openNoteDialog)

  async function promptMemoryCoverSelection(memoryId: string): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      openCropDialog({
        gameId,
        memoryId,
        imagePath: filePath
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.selectFileError', { error }))
    }
  }

  async function addMemory(): Promise<void> {
    try {
      const memory = await ipcManager.invoke('game:add-memory', gameId)
      setMemoryPageByView(gameId, viewMode, 1)

      if (viewMode === 'masonry') {
        await promptMemoryCoverSelection(memory._id)
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
      .sort((a, b) => memoryList[b].date.localeCompare(memoryList[a].date))
  }, [memoryList])

  const noteMemoryIds = useMemo(() => {
    return sortedMemoryIds.filter((id) => Boolean(memoryList[id]?.note?.trim()))
  }, [memoryList, sortedMemoryIds])

  const masonryMemoryIds = useMemo(() => {
    return sortedMemoryIds.filter((id) => {
      const itemInfo = masonryItemByMemoryId[id]
      return Boolean(itemInfo && itemInfo.heightRatio > 0)
    })
  }, [masonryItemByMemoryId, sortedMemoryIds])

  function getViewPaginationState(mode: MemoryViewMode): ViewPaginationState {
    switch (mode) {
      case 'grid': {
        const totalPages = getTotalPages(sortedMemoryIds.length, gridItemsPerPage)
        const currentPage = clampPage(pageByView.grid, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: sortedMemoryIds.length,
          itemsPerPage: gridItemsPerPage,
          pagedMemoryIds: paginateMemoryIds(sortedMemoryIds, currentPage, gridItemsPerPage),
          setItemsPerPage: setGridItemsPerPage
        }
      }
      case 'masonry': {
        const totalPages = getTotalPages(masonryMemoryIds.length, masonryItemsPerPage)
        const currentPage = clampPage(pageByView.masonry, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: masonryMemoryIds.length,
          itemsPerPage: masonryItemsPerPage,
          pagedMemoryIds: paginateMemoryIds(masonryMemoryIds, currentPage, masonryItemsPerPage),
          setItemsPerPage: setMasonryItemsPerPage
        }
      }
      case 'list': {
        const totalPages = getTotalPages(noteMemoryIds.length, listItemsPerPage)
        const currentPage = clampPage(pageByView.list, totalPages)

        return {
          currentPage,
          totalPages,
          itemCount: noteMemoryIds.length,
          itemsPerPage: listItemsPerPage,
          pagedMemoryIds: paginateMemoryIds(noteMemoryIds, currentPage, listItemsPerPage),
          setItemsPerPage: setListItemsPerPage
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

    if (nextGridPage !== pageByView.grid) {
      setMemoryPageByView(gameId, 'grid', nextGridPage)
    }

    if (nextMasonryPage !== pageByView.masonry) {
      setMemoryPageByView(gameId, 'masonry', nextMasonryPage)
    }

    if (nextListPage !== pageByView.list) {
      setMemoryPageByView(gameId, 'list', nextListPage)
    }
  }, [
    gameId,
    gridItemsPerPage,
    listItemsPerPage,
    masonryItemsPerPage,
    masonryMemoryIds.length,
    noteMemoryIds.length,
    pageByView.grid,
    pageByView.list,
    pageByView.masonry,
    setMemoryPageByView,
    sortedMemoryIds.length
  ])

  // Load masonry cover metadata used by both the gallery layout and grid cards.
  useEffect(() => {
    let cancelled = false

    async function loadMemoryMasonryItems(): Promise<void> {
      if (sortedMemoryIds.length === 0) {
        setMasonryItemByMemoryId({})
        setHasLoadedMasonryItems(true)
        return
      }

      setHasLoadedMasonryItems(false)

      try {
        const masonryItems = await ipcManager.invoke(
          'game:get-memory-masonry-items',
          gameId,
          sortedMemoryIds
        )

        if (cancelled) return
        setMasonryItemByMemoryId(masonryItems)
        setHasLoadedMasonryItems(true)
      } catch (error) {
        if (cancelled) return
        setHasLoadedMasonryItems(true)
        toast.error(i18next.t('game:detail.memory.notifications.getImageError', { error }))
      }
    }

    void loadMemoryMasonryItems()

    return (): void => {
      cancelled = true
    }
  }, [gameId, masonryRefreshKey, sortedMemoryIds])

  // Refresh masonry metadata when memory items are created or their covers change.
  useEffect(() => {
    const refreshMasonryItems = ({ gameId: changedGameId }: { gameId: string }): void => {
      if (changedGameId !== gameId) return

      setMasonryRefreshKey((current) => current + 1)
    }

    const unsubscribeMemoryCreated = eventBus.on('game:memory-created', refreshMasonryItems)
    const unsubscribeMemoryCoverUpdated = eventBus.on(
      'game:memory-cover-updated',
      refreshMasonryItems
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

  function handleMasonryCoverMissing(memoryId: string): void {
    setMasonryItemByMemoryId((prev) => {
      if (!prev[memoryId]) return prev

      const next = { ...prev }
      delete next[memoryId]
      return next
    })
  }

  async function handleDelete(memoryId: string): Promise<void> {
    toast.promise(
      async () => {
        // update the memoryList
        const newMemoryList = { ...memoryList }
        delete newMemoryList[memoryId]
        await setMemoryListAndSave(newMemoryList)

        // Finally, perform a back-end delete operation
        await ipcManager.invoke('game:delete-memory', gameId, memoryId)
      },
      {
        loading: t('detail.memory.notifications.deleting'),
        success: t('detail.memory.notifications.deleteSuccess'),
        error: (err) => t('detail.memory.notifications.deleteError', { error: err })
      }
    )
  }

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
                  <TabsTrigger value="masonry" className={cn('size-8 px-0 py-0')}>
                    <span className={cn('icon-[mdi--view-quilt-outline] size-4')} />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('detail.memory.views.masonry')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('inline-flex')}>
                  <TabsTrigger value="list" className={cn('size-8 px-0 py-0')}>
                    <span className={cn('icon-[mdi--format-list-text] size-4')} />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('detail.memory.views.list')}</TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>
      </div>
      {viewMode === 'grid' && sortedMemoryIds.length === 0 && renderEmptyState()}
      {viewMode === 'grid' && sortedMemoryIds.length > 0 && (
        <MemoryCardView
          gameId={gameId}
          memoryIds={activePagination.pagedMemoryIds}
          memoryList={memoryList}
          masonryItemByMemoryId={masonryItemByMemoryId}
          onDelete={handleDelete}
        />
      )}
      {viewMode === 'masonry' &&
        hasLoadedMasonryItems &&
        masonryMemoryIds.length === 0 &&
        renderEmptyState()}
      {viewMode === 'masonry' && masonryMemoryIds.length > 0 && (
        <MemoryMasonryView
          gameId={gameId}
          memoryIds={activePagination.pagedMemoryIds}
          masonryItemByMemoryId={masonryItemByMemoryId}
          columnWidth={masonryColumnWidth}
          onCoverMissing={handleMasonryCoverMissing}
          onDelete={handleDelete}
        />
      )}
      {viewMode === 'list' && noteMemoryIds.length === 0 && renderEmptyState()}
      {viewMode === 'list' && noteMemoryIds.length > 0 && (
        <MemoryListView
          gameId={gameId}
          gameName={gameName}
          memoryIds={activePagination.pagedMemoryIds}
          memoryList={memoryList}
          onDelete={handleDelete}
        />
      )}
      <MemoryCropDialogHost />
      <MemoryNoteDialogHost memoryList={memoryList} saveNote={saveNote} />
    </div>
  )
}
