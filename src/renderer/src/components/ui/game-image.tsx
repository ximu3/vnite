// renderer/components/GameImage.tsx
import React, { useState, useEffect, ImgHTMLAttributes } from 'react'
import { ipcOnUnique, cn } from '~/utils'
import { useImageStore } from '~/hooks/imageStore'

interface GameImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  gameId: string
  type: 'background' | 'cover' | 'icon'
  onUpdated?: () => void
  fallback?: React.ReactNode
  shadow?: boolean
}

export const GameImage: React.FC<GameImageProps> = ({
  gameId,
  type,
  className,
  onError,
  onUpdated,
  fallback = <div>暂无图标</div>,
  shadow = false,
  ...imgProps
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const timestamp = useImageStore((state) => state.getTimestamp(gameId, type))
  const updateTimestamp = useImageStore((state) => state.updateTimestamp)

  useEffect(() => {
    const handleImageUpdate = (_event: any, updatedPath: string): void => {
      if (updatedPath.includes(`games/${gameId}/${type}`)) {
        updateTimestamp(gameId, type)
        setHasError(false)
        setIsLoaded(false)
        onUpdated?.()
      }
    }

    const remove = ipcOnUnique('reload-db-values', handleImageUpdate)
    return (): void => {
      remove()
    }
  }, [gameId, type, onUpdated, updateTimestamp])

  if (hasError) {
    return <>{fallback}</>
  }
  return (
    <div className={cn('relative', className)}>
      {!isLoaded && (
        <div
          className={cn('absolute inset-0', className?.includes('rounded') && 'rounded-[0.3rem]')}
        />
      )}
      <img
        src={`img:///games/${gameId}/${type}?t=${timestamp}`}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
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
