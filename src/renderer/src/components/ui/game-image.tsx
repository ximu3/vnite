// renderer/components/GameImage.tsx
import React, { useState, ImgHTMLAttributes } from 'react'
import { cn } from '~/utils'

interface GameImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  gameId: string
  type: 'background' | 'cover' | 'icon' | 'logo' | string
  onUpdated?: () => void
  fallback?: React.ReactNode
  shadow?: boolean
  flips?: boolean
}

export const GameImage: React.FC<GameImageProps> = ({
  gameId,
  type,
  className,
  onError,
  onUpdated,
  fallback = <div>暂无图标</div>,
  shadow = false,
  flips = false,
  ...imgProps
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // 直接使用附件协议URL
  const attachmentUrl = `attachment://game/${gameId}/images/${type}.webp`

  if (hasError) {
    return <>{fallback}</>
  }

  return (
    <div className={cn('relative', className)}>
      {!isLoaded && (
        <div className={cn('absolute inset-0', className?.includes('rounded') && 'rounded-lg')} />
      )}
      <img
        src={attachmentUrl}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          isLoaded ? 'opacity-100' : 'opacity-0',
          flips && '-scale-y-100',
          className
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          setIsLoaded(true)
          setHasError(false)
          onUpdated?.()
        }}
        onError={(e) => {
          setHasError(true)
          setIsLoaded(false)
          onError?.(e)
        }}
        {...imgProps}
      />
    </div>
  )
}
