import i18next from 'i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'

export async function exportAllMemories(gameId: string): Promise<void> {
  const promise = ipcManager.invoke('game:export-all-memories', gameId)

  toast.promise(promise, {
    loading: i18next.t('game:detail.memory.notifications.exportLoading'),
    success: (result) => {
      switch (result) {
        case 'empty':
          return i18next.t('game:detail.memory.notifications.exportEmpty')
        case 'canceled':
          return i18next.t('game:detail.memory.notifications.exportCanceled')
        case 'success':
          return i18next.t('game:detail.memory.notifications.exportSuccess')
      }
    },
    error: (error) => i18next.t('game:detail.memory.notifications.exportError', { error })
  })
}
