import { useState, useRef, useCallback, useMemo } from 'react'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { Button } from '@ui/button'
import { cn } from '~/utils'
import { ipcInvoke } from '~/utils'

interface CropDialogProps {
  isOpen: boolean
  onClose: () => void
  imagePath: string | null
  onCropComplete: (filePath: string) => void
}

export function CropDialog({
  isOpen,
  onClose,
  imagePath,
  onCropComplete
}: CropDialogProps): JSX.Element | null {
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 0,
    height: 0,
    x: 0,
    y: 0
  })
  const imageRef = useRef<HTMLImageElement>(null)
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  // Add state to store the original size of the image
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget

    // Storing the original size of an image
    setImageSize({ width: naturalWidth, height: naturalHeight })

    // Calculating scaling
    const scale = naturalWidth / width
    console.log('图片缩放比例:', scale)
    console.log('显示尺寸:', width, height)
    console.log('原始尺寸:', naturalWidth, naturalHeight)

    // Set the cropping area to the display size of the whole image
    const cropUpdate: Crop = {
      unit: 'px',
      width,
      height,
      x: 0,
      y: 0
    }
    setCrop(cropUpdate)
    setCompletedCrop(cropUpdate)
  }, [])

  const getCroppedImg = useCallback(async (): Promise<string> => {
    if (!imageRef.current || !completedCrop) {
      throw new Error('裁剪未完成')
    }

    try {
      const canvas = document.createElement('canvas')
      const image = imageRef.current

      // Calculating scaling
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      // Use actual pixel dimensions
      const actualWidth = Math.round(completedCrop.width * scaleX)
      const actualHeight = Math.round(completedCrop.height * scaleY)
      const actualX = Math.round(completedCrop.x * scaleX)
      const actualY = Math.round(completedCrop.y * scaleY)

      console.log('裁剪区域显示尺寸:', completedCrop.width, completedCrop.height)
      console.log('裁剪区域实际像素:', actualWidth, actualHeight)

      // Set the canvas size to the actual output size
      canvas.width = actualWidth
      canvas.height = actualHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('无法获取 2d 上下文')
      }

      // Setting Image Smoothing
      ctx.imageSmoothingQuality = 'high'
      ctx.imageSmoothingEnabled = true

      // Drawing using actual pixel coordinates
      ctx.drawImage(
        image,
        actualX,
        actualY,
        actualWidth,
        actualHeight,
        0,
        0,
        actualWidth,
        actualHeight
      )

      // 转换为 ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('画布为空'))
              return
            }
            blob.arrayBuffer().then(resolve).catch(reject)
          },
          'image/png',
          1.0
        )
      })

      const uint8Array = new Uint8Array(arrayBuffer)
      const tempFilePath = await ipcInvoke('save-temp-image', uint8Array)
      return tempFilePath as string
    } catch (error) {
      console.error('裁剪过程出错:', error)
      throw error
    }
  }, [completedCrop])

  // Add Size Display
  const displaySize = useMemo(() => {
    if (!completedCrop || !imageSize.width) return null

    const scaleX = imageSize.width / (imageRef.current?.width || 1)
    const actualWidth = Math.round(completedCrop.width * scaleX)
    const actualHeight = Math.round(completedCrop.height * scaleX)

    return `${actualWidth} × ${actualHeight} px`
  }, [completedCrop, imageSize])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn('max-w-3xl min-w-0 w-auto')}>
        <DialogHeader>
          <DialogTitle>
            调整图片大小
            {displaySize && (
              <span className={cn('ml-2 text-sm text-gray-500')}>({displaySize})</span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className={cn('flex flex-col gap-4')}>
          <ReactCrop
            crop={crop}
            onChange={(c) => {
              setCrop(c)
              setCompletedCrop(c)
            }}
            onComplete={(c) => setCompletedCrop(c)}
            ruleOfThirds
            className={cn('max-h-[60vh] w-auto')}
          >
            <img
              ref={imageRef}
              src={`file://${imagePath}`}
              onLoad={onImageLoad}
              className={cn('max-h-[60vh] w-auto object-contain')}
            />
          </ReactCrop>
          <div className={cn('flex justify-end gap-2')}>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={async () => {
                const filePath = await getCroppedImg()
                onCropComplete(filePath)
              }}
            >
              确认
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
