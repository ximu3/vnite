import { useEffect } from 'react'
import { ipcManager } from '~/app/ipc'
import { CropDialog } from '../Config/Properties/Media/CropDialog'
import { useMemoryStore } from './store'

export function MemoryCropDialogHost(): React.JSX.Element | null {
  const cropDialog = useMemoryStore((state) => state.cropDialog)
  const closeCropDialog = useMemoryStore((state) => state.closeCropDialog)

  useEffect(() => {
    return (): void => {
      closeCropDialog()
    }
  }, [closeCropDialog])

  if (!cropDialog.open) return null
  const { gameId, memoryId, imagePath, imageSource } = cropDialog

  async function handleCropComplete(filePath: string): Promise<void> {
    await ipcManager.invoke(
      'game:update-memory-cover',
      gameId,
      memoryId,
      filePath,
      imageSource === 'selected-file' ? { originalImagePath: imagePath } : undefined
    )

    closeCropDialog()
  }

  return (
    <CropDialog
      isOpen={cropDialog.open}
      onClose={closeCropDialog}
      imagePath={imagePath}
      onCropComplete={handleCropComplete}
    />
  )
}
