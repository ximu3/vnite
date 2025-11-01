import React, { ImgHTMLAttributes, useRef, useState } from 'react'
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
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const maskRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className={cn('absolute inset-0 ', className?.includes('rounded') && 'rounded-lg')} />
      )}

      <img
        src={attachmentUrl}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          // isLoaded ? 'opacity-100' : 'opacity-0',
          flips && '-scale-y-100',
          blur && blurClassMap[blurType],
          className
        )}
        // loading="lazy"
        // decoding="async"
        onLoad={() => {
          setIsLoaded(true)
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
          - Prevent NSFW image flash before the image fully loads

        Notes:
          - Must not depend on any React state or conditional rendering as initial DOM must exist to cover the image
          - Use `maskRef` to control visibility or fade-out after load
          - Only used for the initial mask; not applied continuously for NSFW
            because hover/scale animation may expose edges that cannot be fully blurred
      */}
      <div
        ref={maskRef}
        className={cn('absolute inset-0 bg-transparent backdrop-blur-2xl pointer-events-none')}
      />
    </div>
  )
}
