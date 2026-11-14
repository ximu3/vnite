import type { GameMediaType } from '@appTypes/models'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { HelpTooltip, Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useLibraryStore } from '~/pages/Library/store'
import { useConfigStore } from '~/stores'
import { cn } from '~/utils'
import {
  GAME_DETAIL_BACKGROUND_FADE_END,
  GAME_DETAIL_BACKGROUND_TOP,
  getGameDetailBackgroundLeft
} from '~/utils/game-background'

const WIDE_COVER_ASPECT = 3 / 2

function fitWideCoverCrop(crop: Crop): Crop {
  const width = Math.min(crop.width, crop.height * WIDE_COVER_ASPECT)
  const height = width / WIDE_COVER_ASPECT

  return {
    ...crop,
    x: crop.x + (crop.width - width) / 2,
    y: crop.y + (crop.height - height) / 2,
    width,
    height
  }
}

interface CropDialogProps {
  isOpen: boolean
  onClose: () => void
  imagePath: string | null
  mediaType?: GameMediaType
  onCropComplete: (filePath: string) => void | Promise<void>
}

export function CropDialog({
  isOpen,
  onClose,
  imagePath,
  mediaType,
  onCropComplete
}: CropDialogProps): React.JSX.Element | null {
  const { t } = useTranslation('game')
  const isWideCover = mediaType === 'wideCover'
  const [isAspectLocked, setIsAspectLocked] = useState(isWideCover)
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

  const isBackground = mediaType === 'background'
  // Show a guide within the crop for the detail page background's visible extent after fade-out clipping.
  const backgroundFadeRatio = useMemo(() => {
    if (!isBackground) return null

    const width =
      window.innerWidth - getGameDetailBackgroundLeft(useLibraryStore.getState().libraryBarWidth)
    const height = window.innerHeight - GAME_DETAIL_BACKGROUND_TOP
    const maxImageHeight =
      (window.innerHeight *
        useConfigStore.getState().getConfigValue('appearances.gameDetail.headerImageMaxHeight')) /
      100
    if (width <= 0 || height <= 0 || maxImageHeight <= 0) return null

    // Match the gradient rendering in pages/Light.tsx
    return Math.min(maxImageHeight, height * GAME_DETAIL_BACKGROUND_FADE_END) / width
  }, [isBackground])
  const backgroundFadeEnd =
    backgroundFadeRatio !== null && crop.width > 0 && crop.height > 0
      ? Math.min(1, (backgroundFadeRatio * crop.width) / crop.height) * 100
      : null

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>): void => {
      const { width, height, naturalWidth, naturalHeight } = e.currentTarget

      // Storing the original size of an image
      setImageSize({ width: naturalWidth, height: naturalHeight })

      // Calculating scaling
      const scale = naturalWidth / width
      console.log('Image scaling:', scale)
      console.log('Display size:', width, height)
      console.log('Original size:', naturalWidth, naturalHeight)

      // Set the cropping area to the display size of the whole image
      let cropUpdate: Crop = {
        unit: 'px',
        width,
        height,
        x: 0,
        y: 0
      }
      // Wide covers start with the largest centered crop matching recent game posters.
      if (isWideCover) {
        cropUpdate = fitWideCoverCrop(cropUpdate)
      }
      setCrop(cropUpdate)
      setCompletedCrop(cropUpdate)
    },
    [isWideCover]
  )

  const handleAspectLockChange = (locked: boolean): void => {
    setIsAspectLocked(locked)
    if (!locked) return

    // Re-lock within the current selection; the button requires a valid crop.
    const cropUpdate = fitWideCoverCrop(crop)
    setCrop(cropUpdate)
    setCompletedCrop(cropUpdate)
  }

  // Add Size Display
  const displaySize = useMemo(() => {
    if (!completedCrop || !imageSize.width) return null

    const scaleX = imageSize.width / (imageRef.current?.width || 1)
    const actualWidth = Math.round(completedCrop.width * scaleX)
    const actualHeight = Math.round(completedCrop.height * scaleX)

    return t('detail.properties.media.crop.size', { width: actualWidth, height: actualHeight })
  }, [completedCrop, imageSize])

  const handleCrop = async (): Promise<void> => {
    try {
      if (!completedCrop || !imagePath || !imageRef.current) {
        throw new Error(t('detail.properties.media.notifications.cropIncomplete'))
      }

      const image = imageRef.current

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      // Calculate actual cut size
      const actualX = Math.max(0, Math.round(completedCrop.x * scaleX))
      const actualY = Math.max(0, Math.round(completedCrop.y * scaleY))
      const actualWidth = Math.min(
        Math.round(completedCrop.width * scaleX),
        image.naturalWidth - actualX
      )
      const actualHeight = Math.min(
        Math.round(completedCrop.height * scaleY),
        image.naturalHeight - actualY
      )

      // If it is the original size then it returns directly
      if (actualWidth === imageSize.width && actualHeight === imageSize.height) {
        await onCropComplete(imagePath)
        return
      }

      const filePath = await ipcManager.invoke('utils:crop-image', {
        sourcePath: imagePath,
        x: actualX,
        y: actualY,
        width: actualWidth,
        height: actualHeight
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      await onCropComplete(filePath)
    } catch (error) {
      console.error('Cropping Failure:', error)
      throw error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn('w-auto')}
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          if (isWideCover || isBackground) {
            // Prevent the header button's tooltip from showing when the dialog opens.
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className={cn('flex-row items-center justify-between text-left')}>
          <DialogTitle>
            {t('detail.properties.media.crop.title')}
            {displaySize && (
              <span className={cn('ml-2 text-sm text-muted-foreground')}>({displaySize})</span>
            )}
          </DialogTitle>
          {isBackground && (
            <HelpTooltip side="bottom" className={cn('max-w-80 whitespace-normal text-wrap')}>
              {t('detail.properties.media.crop.backgroundGuideHelp')}
            </HelpTooltip>
          )}
          {isWideCover && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="bare"
                  size="icon"
                  className={cn(isAspectLocked ? 'text-primary' : 'text-foreground')}
                  disabled={
                    imageSize.width <= 0 ||
                    imageSize.height <= 0 ||
                    crop.width <= 0 ||
                    crop.height <= 0
                  }
                  onClick={() => handleAspectLockChange(!isAspectLocked)}
                >
                  <span className={cn('size-4 icon-[mdi--lock]')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('detail.properties.media.crop.lockWideCoverAspect')}
              </TooltipContent>
            </Tooltip>
          )}
        </DialogHeader>
        <div className={cn('flex flex-col gap-4')}>
          <ReactCrop
            crop={crop}
            aspect={isWideCover && isAspectLocked ? WIDE_COVER_ASPECT : undefined}
            onChange={(c) => {
              setCrop(c)
              setCompletedCrop(c)
            }}
            onComplete={(c) => setCompletedCrop(c)}
            ruleOfThirds
            renderSelectionAddon={() =>
              backgroundFadeEnd !== null &&
              backgroundFadeEnd < 100 && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-x-px bottom-px', // avoid covering the crop selection's dashed outline.
                    'border-t-2 border-dashed border-foreground',
                    'bg-background/50 bg-clip-padding'
                  )}
                  style={{ top: `calc(${backgroundFadeEnd}% - 2px)` }}
                />
              )
            }
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
              {t('utils:common.cancel')}
            </Button>
            <Button
              onClick={() => {
                toast.promise(
                  async () => {
                    await handleCrop()
                  },
                  {
                    loading: t('detail.properties.media.notifications.cropping'),
                    success: t('detail.properties.media.notifications.cropSuccess'),
                    error: t('detail.properties.media.notifications.cropError')
                  }
                )
              }}
            >
              {t('utils:common.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
