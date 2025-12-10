import React, { ImgHTMLAttributes, useRef, useState } from 'react'
import smartcrop from 'smartcrop'
import { useAttachmentStore } from '~/stores'
import { cn } from '~/utils'

interface GameImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  gameId: string
  type: 'background' | 'cover' | 'icon' | 'logo' | string
  onUpdated?: () => void
  fallback?: React.ReactNode
  shadow?: boolean
  flips?: boolean
  blur?: boolean
  blurType?: 'bigposter' | 'poster' | 'smallposter'
  initialMask?: boolean
}

export const GameImage: React.FC<GameImageProps> = ({
  gameId,
  type,
  className,
  onError,
  onUpdated,
  fallback = <div>No Pictures</div>,
  shadow = false,
  flips = false,
  blur = false,
  blurType = 'poster',
  initialMask = false,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const maskRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [objectPosition, setObjectPosition] = useState('center')

  const attachmentInfo = getAttachmentInfo('game', gameId, `images/${type}.webp`)

  const blurClassMap: Record<'bigposter' | 'poster' | 'smallposter', string> = {
    bigposter: 'filter blur-[36px]',
    poster: 'filter blur-[24px]',
    smallposter: 'filter blur-[8px]'
  }

  // If the image is known to have an error, return fallback directly
  const attachmentUrl = `attachment://game/${gameId}/images/${type}.webp?t=${
    attachmentInfo?.timestamp
  }`

  if (attachmentInfo?.error) {
    return <>{fallback}</>
  }

  const clearMaskOverlay = (): void => {
    if (maskRef.current) {
      setTimeout(() => {
        if (maskRef.current) {
          maskRef.current.style.display = 'none'
        }
      }, 300)
    }
  }

  const smartCrop = async (): Promise<void> => {
    const img = imgRef.current
    if (img && type === 'cover') {
      try {
        await img.decode?.()

        const clientRatio = img.clientWidth / img.clientHeight
        const imgRatio = img.naturalWidth / img.naturalHeight

        // Symmetric metric for aspect ratio difference:
        // - swapping imgRatio and clientRatio does not change the value
        // - swapping width and height of either ratio (transpose) also preserves the value
        const ratioDiff = Math.abs(Math.log(imgRatio / clientRatio))

        // Use smartcrop when the cropped portion exceeds roughly 22% relative to the visible area
        // Computed as: exp(ratioDiff) - 1
        if (ratioDiff > 0.2) {
          const result = await smartcrop.crop(img, {
            width: img.clientWidth,
            height: img.clientHeight
          })

          const crop = result.topCrop

          // The meaning of objectPosition is: the point at (u%, v%) in the source image
          // aligns with the point at (u%, v%) in the display container.
          // Therefore, the following calculation is based on the equations:
          // crop.x + crop.width * u = img.naturalWidth * u
          // crop.y + crop.height * v = img.naturalHeight * v
          let u = (crop.x / (img.naturalWidth - crop.width)) * 100
          let v = (crop.y / (img.naturalHeight - crop.height)) * 100
          u = u >= 0 && u <= 100 ? u : 50
          v = v >= 0 && v <= 100 ? v : 50

          setObjectPosition(`${u}% ${v}%`)
        }
      } catch (err) {
        console.error('smartcrop error:', err)
      }
    }
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className={cn('absolute inset-0 ', className?.includes('rounded') && 'rounded-lg')} />
      )}

      <img
        ref={imgRef}
        src={attachmentUrl}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          // isLoaded ? 'opacity-100' : 'opacity-0',
          flips && '-scale-y-100',
          blur && blurClassMap[blurType],
          className
        )}
        style={{
          objectFit: 'cover',
          objectPosition
        }}
        // loading="lazy"
        // decoding="async"
        onLoad={() => {
          setIsLoaded(true)
          smartCrop()
          onUpdated?.()
          clearMaskOverlay()
        }}
        onError={(e) => {
          setAttachmentError('game', gameId, `images/${type}.webp`, true)
          setIsLoaded(false)
          onError?.(e)
          clearMaskOverlay()
        }}
        {...imgProps}
      />

      {/*
        Mask Overlay
        -----------------
        Purpose:
          - Prevent NSFW image flash before the image fully loads (usually occurs on the initial program load)

        Notes:
          - Must not depend on any React state or conditional rendering as initial DOM must exist to cover the image
          - Use `maskRef` to control visibility or fade-out after load
          - Only used for the initial mask; not applied continuously for NSFW
            because hover/scale animation may expose edges that cannot be fully blurred
      */}
      {initialMask && (
        <div
          ref={maskRef}
          className={cn('absolute inset-0 bg-transparent backdrop-blur-2xl pointer-events-none')}
        />
      )}
    </div>
  )
}
