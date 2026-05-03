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
  const { gameId, memoryId, imagePath } = cropDialog

  function handleCropComplete(filePath: string): void {
    void ipcManager.invoke('game:update-memory-cover', gameId, memoryId, filePath)
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
