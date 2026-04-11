import { create } from 'zustand'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc/IPCManager'

interface BatchStorageSizeState {
  isRunning: boolean
  currentTaskId: string | null
  startCalculation: (
    gameIds: string[],
    t: (key: string, options?: Record<string, unknown>) => string
  ) => Promise<void>
}

// Unique ID to track which startCalculation call is currently active
let currentCallId = 0

export const useBatchStorageSizeStore = create<BatchStorageSizeState>((set, get) => ({
  isRunning: false,
  currentTaskId: null,

  startCalculation: async (gameIds: string[], t) => {
    // Check if already running - use IPC to check backend state
    const isRunningInBackend = await ipcManager.invoke(
      'game:is-batch-storage-size-calculation-running'
    )
    if (isRunningInBackend || get().isRunning) {
      // Show warning toast to user
      toast.warning(t('batchEditor.storageSize.alreadyRunning'))
      return
    }

    // Increment call ID to track this specific invocation
    const thisCallId = ++currentCallId
    set({ isRunning: true, currentTaskId: null })

    // Listen for progress events and update toast
    const handleProgress = (
      _: Electron.IpcRendererEvent,
      data: { taskId: string; current: number; total: number; gameName: string }
    ): void => {
      // Only process if this is still the active call
      if (thisCallId !== currentCallId) {
        return
      }
      // Verify this progress belongs to our task
      const currentTaskId = get().currentTaskId
      if (currentTaskId && data.taskId !== currentTaskId) {
        return // Ignore progress from old/other tasks
      }
      set({ currentTaskId: data.taskId })

      toast.loading(
        t('batchEditor.storageSize.notifications.progress', {
          current: data.current,
          total: data.total,
          name: data.gameName
        }),
        {
          id: 'batch-calculate-size',
          cancel: {
            label: t('batchEditor.storageSize.cancel'),
            onClick: () => {
              ipcManager.invoke('game:cancel-batch-storage-size-calculation')
              // Mark this call as no longer active
              if (thisCallId === currentCallId) {
                set({ isRunning: false, currentTaskId: null })
              }
              toast.loading(t('batchEditor.storageSize.cancelling'), {
                id: 'batch-calculate-size',
                cancel: undefined
              })
            }
          }
        }
      )
    }

    const removeListener = ipcManager.onUnique(
      'game:batch-calculate-storage-size-progress',
      handleProgress
    )

    try {
      const result = await ipcManager.invoke('game:batch-calculate-storage-size', gameIds)

      // Only process result if this is still the active call
      if (thisCallId !== currentCallId) {
        return
      }

      // Check if task was cancelled
      if (result.wasCancelled) {
        toast.info(t('batchEditor.storageSize.cancelled'), {
          id: 'batch-calculate-size',
          cancel: undefined
        })
      } else {
        toast.success(
          t('batchEditor.storageSize.notifications.complete', {
            success: result.successful,
            failed: result.failed
          }),
          { id: 'batch-calculate-size', cancel: undefined }
        )
      }
    } catch (error) {
      // Only show error if this is still the active call
      if (thisCallId === currentCallId) {
        toast.error(
          t('batchEditor.storageSize.notifications.error', {
            message: error instanceof Error ? error.message : 'Unknown error'
          }),
          { id: 'batch-calculate-size', cancel: undefined }
        )
      }
    } finally {
      removeListener()
      // Only clear state if this is still the active call
      if (thisCallId === currentCallId) {
        set({ isRunning: false, currentTaskId: null })
      }
    }
  }
}))
