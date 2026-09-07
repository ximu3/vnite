import i18next from 'i18next'
import { toast } from 'sonner'

import type { GameMediaType } from '@appTypes/models'
import { ipcManager } from '~/app/ipc'
import { createAttachmentUrl } from '~/utils'
import type { ImageViewerRequest } from '~/utils/image-viewer'

type OpenImageViewer = (request: ImageViewerRequest) => void

export async function openLargeGameMediaImage({
  gameId,
  type,
  openImageViewer
}: {
  gameId: string
  type: GameMediaType
  openImageViewer: OpenImageViewer
}): Promise<void> {
  const attachmentId = `images/${type}.webp`

  try {
    const exists = await ipcManager.invoke('db:check-attachment', 'game', gameId, attachmentId)
    if (!exists) {
      toast.error(i18next.t('game:detail.properties.media.notifications.imageNotFound'))
      return
    }

    openImageViewer({
      items: [
        {
          key: `game-media-${gameId}-${type}`,
          src: createAttachmentUrl('game', gameId, attachmentId)
        }
      ],
      initialIndex: 0
    })
  } catch (error) {
    toast.error(i18next.t('game:detail.properties.media.notifications.getImageError', { error }))
  }
}

export function openLargeMemoryImage({
  gameId,
  memoryId,
  memoryIds,
  openImageViewer
}: {
  gameId: string
  memoryId: string
  memoryIds: string[]
  openImageViewer: OpenImageViewer
}): void {
  const orderedMemoryIds = memoryIds.includes(memoryId) ? memoryIds : [memoryId]
  const initialIndex = orderedMemoryIds.indexOf(memoryId)

  const cacheKey = Date.now()
  openImageViewer({
    items: orderedMemoryIds.map((id) => ({
      key: `game-memory-${gameId}-${id}`,
      src: createAttachmentUrl('game', gameId, `images/memories/${id}.webp`, cacheKey)
    })),
    initialIndex
  })
}
