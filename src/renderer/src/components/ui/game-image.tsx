import React from 'react'
import { ImgHTMLAttributes } from 'react'
import { useAttachmentStore } from '~/stores'
import { cn } from '~/utils'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import type { Effect } from 'react-lazy-load-image-component' // 导入Effect类型
import 'react-lazy-load-image-component/src/effects/blur.css'

interface GameImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  gameId: string
  type: 'background' | 'cover' | 'icon' | 'logo' | string
  onUpdated?: () => void
  fallback?: React.ReactNode
  shadow?: boolean
  flips?: boolean
  effect?: Effect
  scrollPosition?: { x: number; y: number }
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
  effect = 'blur' as Effect,
  scrollPosition,
  ...imgProps
}) => {
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()

  const attachmentInfo = getAttachmentInfo('game', gameId, `images/${type}.webp`)

  const attachmentUrl = `attachment://game/${gameId}/images/${type}.webp?t=${
    attachmentInfo?.timestamp
  }`

  // If the image is known to have an error, return fallback directly
  if (attachmentInfo?.error) {
    return <>{fallback}</>
  }

  const placeholder = (
    <div className={cn('w-full h-full', className?.includes('rounded') && 'rounded-lg')}></div>
  )

  return (
    <div className={cn('relative', className)}>
      <LazyLoadImage
        src={attachmentUrl}
        effect={effect}
        placeholder={placeholder}
        scrollPosition={scrollPosition}
        wrapperClassName={cn('w-full h-full')}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          flips && '-scale-y-100',
          className
        )}
        onLoad={() => {
          onUpdated?.()
        }}
        onError={(e) => {
          setAttachmentError('game', gameId, `images/${type}.webp`, true)
          onError?.(e)
        }}
        threshold={300}
        wrapperProps={{
          style: {
            display: 'block',
            width: '100%',
            height: '100%'
          }
        }}
        {...imgProps}
      />

      <noscript>{fallback}</noscript>
    </div>
  )
}
