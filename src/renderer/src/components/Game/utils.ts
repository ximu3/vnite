import i18next from 'i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'

type GameMediaType = 'cover' | 'background' | 'icon' | 'logo'

type OpenImageViewerDialog = (imagePath: string) => void

async function openResolvedLargeImage({
  getImagePath,
  openImageViewerDialog,
  imageNotFoundKey,
  getImageErrorKey
}: {
  getImagePath: () => Promise<string | null | undefined>
  openImageViewerDialog: OpenImageViewerDialog
  imageNotFoundKey: string
  getImageErrorKey: string
}): Promise<void> {
  try {
    const currentPath = await getImagePath()

    if (!currentPath) {
      toast.error(i18next.t(imageNotFoundKey))
      return
    }

    openImageViewerDialog(currentPath)
  } catch (error) {
    toast.error(i18next.t(getImageErrorKey, { error }))
  }
}

export async function openLargeGameMediaImage({
  gameId,
  type,
  openImageViewerDialog
}: {
  gameId: string
  type: GameMediaType
  openImageViewerDialog: OpenImageViewerDialog
}): Promise<void> {
  await openResolvedLargeImage({
    getImagePath: () => ipcManager.invoke('game:get-media-path', gameId, type),
    openImageViewerDialog,
    imageNotFoundKey: 'game:detail.properties.media.notifications.imageNotFound',
    getImageErrorKey: 'game:detail.properties.media.notifications.getImageError'
  })
}

export async function openLargeMemoryImage({
  gameId,
  memoryId,
  openImageViewerDialog
}: {
  gameId: string
  memoryId: string
  openImageViewerDialog: OpenImageViewerDialog
}): Promise<void> {
  await openResolvedLargeImage({
    getImagePath: () => ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId),
    openImageViewerDialog,
    imageNotFoundKey: 'game:detail.memory.notifications.imageNotFound',
    getImageErrorKey: 'game:detail.memory.notifications.getImageError'
  })
}
