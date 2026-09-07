import type { gameDoc } from '@appTypes/models/game'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useLightStore } from '~/pages/Light'
import { useGameDetailStore } from '../store'
import { openLargeMemoryImage } from '../utils'
import { useMemoryStore } from './store'
import type { MemoryViewRuntime } from './type'

type MemoryList = gameDoc['memory']['memoryList']

export function useMemoryViewRuntime({
  gameId,
  memoryList,
  viewerMemoryIds,
  setMemoryListAndSave,
  setCoverHeightRatioByMemoryId
}: {
  gameId: string
  memoryList: MemoryList
  viewerMemoryIds: string[]
  setMemoryListAndSave: (memoryList: MemoryList) => Promise<void>
  setCoverHeightRatioByMemoryId: Dispatch<SetStateAction<Record<string, number>>>
}): MemoryViewRuntime {
  const { t } = useTranslation('game')
  const refreshLight = useLightStore((state) => state.refresh)
  const openImageViewer = useGameDetailStore((state) => state.openImageViewer)
  const openCropDialog = useMemoryStore((state) => state.openCropDialog)

  function openImage(memoryId: string): void {
    openLargeMemoryImage({
      gameId,
      memoryId,
      memoryIds: viewerMemoryIds,
      openImageViewer
    })
  }

  async function togglePin(memoryId: string): Promise<void> {
    const currentMemory = memoryList[memoryId]
    if (!currentMemory) return

    const pinned = !currentMemory.pinned
    const newMemoryList = {
      ...memoryList,
      [memoryId]: {
        ...currentMemory,
        pinned
      }
    }

    try {
      await setMemoryListAndSave(newMemoryList)
      toast.success(
        t(
          pinned
            ? 'detail.memory.notifications.pinSuccess'
            : 'detail.memory.notifications.unpinSuccess'
        )
      )
    } catch (error) {
      toast.error(
        t(
          pinned
            ? 'detail.memory.notifications.pinError'
            : 'detail.memory.notifications.unpinError',
          { error }
        )
      )
    }
  }

  async function deleteMemory(memoryId: string): Promise<void> {
    toast.promise(
      async () => {
        const newMemoryList = { ...memoryList }
        delete newMemoryList[memoryId]
        await setMemoryListAndSave(newMemoryList)
        await ipcManager.invoke('game:delete-memory', gameId, memoryId)
      },
      {
        loading: t('detail.memory.notifications.deleting'),
        success: t('detail.memory.notifications.deleteSuccess'),
        error: (err) => t('detail.memory.notifications.deleteError', { error: err })
      }
    )
  }

  async function selectCover(memoryId: string): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      openCropDialog({
        gameId,
        memoryId,
        imagePath: filePath,
        imageSource: 'selected-file'
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.selectFileError', { error }))
    }
  }

  async function resizeCover(memoryId: string): Promise<void> {
    try {
      const currentPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
      if (!currentPath) {
        toast.error(t('detail.memory.notifications.imageNotFound'))
        return
      }

      openCropDialog({
        gameId,
        memoryId,
        imagePath: currentPath,
        imageSource: 'existing-cover'
      })
    } catch (error) {
      toast.error(t('detail.memory.notifications.getImageError', { error }))
    }
  }

  async function setCoverAsGameMedia(
    memoryId: string,
    type: 'cover' | 'background'
  ): Promise<void> {
    try {
      const coverPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
      if (!coverPath) {
        toast.error(t('detail.memory.notifications.imageNotFound'))
        return
      }

      await ipcManager.invoke('game:set-image', gameId, type, coverPath)
      refreshLight()
      toast.success(
        t(
          type === 'cover'
            ? 'detail.memory.notifications.setCoverSuccess'
            : 'detail.memory.notifications.setBackgroundSuccess'
        )
      )
    } catch (error) {
      toast.error(
        t(
          type === 'cover'
            ? 'detail.memory.notifications.setCoverError'
            : 'detail.memory.notifications.setBackgroundError',
          { error }
        )
      )
    }
  }

  function markCoverMissing(memoryId: string): void {
    setCoverHeightRatioByMemoryId((prev) => {
      if (!prev[memoryId]) return prev

      const next = { ...prev }
      delete next[memoryId]
      return next
    })
  }

  return {
    gameId,
    openImage,
    togglePin,
    deleteMemory,
    selectCover,
    resizeCover,
    setCoverAsGameMedia,
    markCoverMissing
  }
}
