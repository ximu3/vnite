import { fileTypeFromBuffer } from 'file-type'
import { baseDBManager } from '~/core/database'

export async function removeGameImageAttachment(
  gameId: string,
  attachmentId: string
): Promise<void> {
  // Only image-type attachments may be removed through this generic handler.
  // Other categories (saves, etc.) have structured document fields
  // referencing the attachment — removing the blob without cleaning up those
  // references would leave the document in an inconsistent state. Those types
  // must go through their own dedicated cleanup flows instead.
  const buffer = await baseDBManager.getAttachment('game', gameId, attachmentId)
  if (!buffer) {
    throw new Error('Attachment not found')
  }

  const fileType = await fileTypeFromBuffer(buffer as Uint8Array)
  if (!fileType || !fileType.mime.startsWith('image/')) {
    throw new Error(
      `Attachment "${attachmentId}" is not an image (detected: ${fileType?.mime ?? 'unknown'}). Only image attachments can be removed through this handler.`
    )
  }

  await baseDBManager.removeAttachment('game', gameId, attachmentId)
}
