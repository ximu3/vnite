import { Button } from '@ui/button'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useConfigState, useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { MemoryCardView } from './MemoryCardView'

type MemoryViewMode = 'grid'

export function Memory({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [memoryList, , , setMemoryListAndSave] = useGameState(gameId, 'memory.memoryList', true)
  const [sortedMemoryIds, setSortedMemoryIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<MemoryViewMode>('grid')
  const [screenshotPath] = useGameLocalState(gameId, 'path.screenshotPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [rootSaveDir] = useConfigState('memory.image.saveDir')

  async function addMemory(): Promise<void> {
    await ipcManager.invoke('game:add-memory', gameId)
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

  useEffect(() => {
    // Recalculate sortedMemoryIds when memoryList is updated.
    const ids = Object.keys(memoryList)
      .filter((id) => memoryList[id] && memoryList[id].date) // Filter out invalid data
      .sort((a, b) => memoryList[b].date.localeCompare(memoryList[a].date))
    setSortedMemoryIds(ids)
  }, [memoryList])

  async function handleDelete(memoryId: string): Promise<void> {
    toast.promise(
      async () => {
        // First, remove the memoryId from sortedMemoryIds
        setSortedMemoryIds((prev) => prev.filter((id) => id !== memoryId))

        // and then update the memoryList
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
    const newMemoryList = {
      ...memoryList,
      [memoryId]: {
        ...memoryList[memoryId],
        note
      }
    }
    await setMemoryListAndSave(newMemoryList)
  }

  return (
    <div className={cn('w-full h-full min-h-[22vh] flex flex-col pt-2 gap-5')}>
      <div className={cn('flex items-center justify-between gap-3')}>
        <div className={cn('flex items-center gap-3')}>
          <Button variant="default" size={'icon'} onClick={addMemory}>
            <span className={cn('icon-[mdi--add] w-6 h-6')}></span>
          </Button>
          <Button variant="secondary" onClick={openScreenshotDir}>
            {t('detail.memory.actions.openScreenshotDir')}
          </Button>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as MemoryViewMode)}
          className={cn('shrink-0')}
        >
          <TabsList>
            <TabsTrigger value="grid" className={cn('gap-2 px-4')}>
              <span className={cn('icon-[mdi--view-grid-outline] size-4')} />
              {t('detail.memory.views.grid', { defaultValue: 'Cards' })}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {viewMode === 'grid' && (
        <MemoryCardView
          gameId={gameId}
          memoryIds={sortedMemoryIds}
          memoryList={memoryList}
          onDelete={handleDelete}
          onSaveNote={saveNote}
        />
      )}
    </div>
  )
}
