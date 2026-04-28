import { Button } from '@ui/button'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import i18next from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { eventBus } from '~/app/events'
import { ipcManager } from '~/app/ipc'
import { useConfigState, useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { MemoryCardView } from './MemoryCardView'
import { MemoryCropDialogHost } from './MemoryCropDialogHost'
import { MemoryMasonryItemInfo, MemoryMasonryView } from './MemoryMasonryView'
import { MemoryNoteDialogHost } from './MemoryNoteDialogHost'
import { useMemoryStore } from './store'

type MemoryViewMode = 'grid' | 'masonry' | 'list'

export function Memory({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [memoryList, , , setMemoryListAndSave] = useGameState(gameId, 'memory.memoryList', true)
  const [viewMode, setViewMode] = useState<MemoryViewMode>('grid')
  const [pendingNoteMemoryId, setPendingNoteMemoryId] = useState<string | null>(null)
  const [masonryRefreshKey, setMasonryRefreshKey] = useState(0)
  const [masonryItemByMemoryId, setMasonryItemByMemoryId] = useState<
    Record<string, MemoryMasonryItemInfo>
  >({})

  const [screenshotPath] = useGameLocalState(gameId, 'path.screenshotPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [rootSaveDir] = useConfigState('memory.image.saveDir')
  const [masonryColumnWidth] = useConfigState('appearances.memory.masonryColumnWidth')
  const openCropDialog = useMemoryStore((state) => state.openCropDialog)
  const openNoteDialog = useMemoryStore((state) => state.openNoteDialog)

  async function promptMemoryCoverSelection(memoryId: string): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      openCropDialog({
        gameId,
        memoryId,
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.selectFileError', { error }))
    }
  }

  async function addMemory(): Promise<void> {
    try {
      const memory = await ipcManager.invoke('game:add-memory', gameId)

      if (viewMode === 'masonry') {
        await promptMemoryCoverSelection(memory._id)
        return
      }

      if (viewMode === 'list') {
        // TODO: Wire this branch to the future list-view tab when that layout is implemented.
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
      // This sanitization is kept consistent with src/main/features/system/services/screenshot.ts
      const sanitizedName = gameName.replace(/[<>:"/\\|?*]/g, ' ')
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

  useEffect(() => {
    let cancelled = false

    async function loadMemoryMasonryItems(): Promise<void> {
      if (sortedMemoryIds.length === 0) {
        setMasonryItemByMemoryId({})
        return
      }

      try {
        const masonryItems = await ipcManager.invoke(
          'game:get-memory-masonry-items',
          gameId,
          sortedMemoryIds
        )

        if (cancelled) return
        setMasonryItemByMemoryId(masonryItems)
      } catch (error) {
        if (cancelled) return
        toast.error(i18next.t('game:detail.memory.notifications.getImageError', { error }))
      }
    }

    void loadMemoryMasonryItems()

    return (): void => {
      cancelled = true
    }
  }, [gameId, masonryRefreshKey, sortedMemoryIds])

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

  return (
    <div className={cn('w-full h-full min-h-[22vh] flex flex-col pt-2 gap-5')}>
      <div className={cn('flex items-center justify-between gap-3')}>
        <div className={cn('flex items-center gap-3')}>
          <Button variant="default" size="icon" onClick={addMemory}>
            <span className={cn('icon-[mdi--add] w-6 h-6')}></span>
          </Button>
          <Button variant="secondary" onClick={openScreenshotDir}>
            {t('detail.memory.actions.openScreenshotDir')}
          </Button>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as MemoryViewMode)}
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
          </TabsList>
        </Tabs>
      </div>
      {viewMode === 'grid' && (
        <MemoryCardView
          gameId={gameId}
          memoryIds={sortedMemoryIds}
          memoryList={memoryList}
          onDelete={handleDelete}
        />
      )}
      {viewMode === 'masonry' && (
        <MemoryMasonryView
          gameId={gameId}
          memoryIds={sortedMemoryIds}
          masonryItemByMemoryId={masonryItemByMemoryId}
          columnWidth={masonryColumnWidth}
          onCoverMissing={handleMasonryCoverMissing}
          onDelete={handleDelete}
        />
      )}
      <MemoryCropDialogHost />
      <MemoryNoteDialogHost memoryList={memoryList} saveNote={saveNote} />
    </div>
  )
}
