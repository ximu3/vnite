import React, { ImgHTMLAttributes, useEffect, useState } from 'react'
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
}

async function getFirstImageName(dbName: string, docId: string, type: string): Promise<string | null> {
  const allNames = await window.api.database.getAllAttachmentNames(dbName, docId)
  return allNames.find(name => new RegExp(`^images/${type}\\.[^.]+$`, 'i').test(name)) || null
}

export const GameImage: React.FC<GameImageProps> = ({
  gameId,
  type,
  className,
  onError,
  onUpdated,
  fallback = <div>No pictures</div>,
  shadow = false,
  flips = false,
  blur = false,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [imageName, setImageName] = useState<string | null>(null)
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()

  // Fetch the first image name with any extension on mount or when gameId/type changes
  useEffect(() => {
    let cancelled = false
    getFirstImageName('game', gameId, type).then(name => {
      if (!cancelled) setImageName(name)
    })
    return () => { cancelled = true }
  }, [gameId, type])

  // If no image found, show fallback
  if (!imageName) {
    return <>{fallback}</>
  }

  const attachmentInfo = getAttachmentInfo('game', gameId, imageName)
  if (attachmentInfo?.error) {
    return <>{fallback}</>
  }

  const attachmentUrl = `attachment://game/${gameId}/${imageName}?t=${attachmentInfo?.timestamp}`
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className={cn('absolute inset-0', className?.includes('rounded') && 'rounded-lg')} />
      )}
      <img
        src={attachmentUrl}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          // isLoaded ? 'opacity-100' : 'opacity-0',
          flips && '-scale-y-100',
          blur && 'filter blur-xl',
          className
        )}
        // loading="lazy"
        // decoding="async"
        onLoad={() => {
          setIsLoaded(true)
          onUpdated?.()
        }}
        onError={(e) => {
          setAttachmentError('game', gameId, `images/${imageName}?t=${attachmentInfo?.timestamp}`, true)
          setIsLoaded(false)
          onError?.(e)
        }}
        {...imgProps}
      />
    </div>
  )
}
