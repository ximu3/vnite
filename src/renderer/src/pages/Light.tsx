import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useConfigState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
import { sortGames, useGameCollectionStore } from '~/stores/game'
import { cn } from '~/utils'

export function Light(): JSX.Element {
  const { pathname } = useLocation()
  const [gameId, setGameId] = useState<string>('')
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const getGameCollectionValue = useGameCollectionStore((state) => state.getGameCollectionValue)
  const collections = useGameCollectionStore((state) => state.documents)
  const [customBackgroundMode] = useConfigState('appearances.background.customBackgroundMode')
  const [glassBlur] = useConfigState('appearances.glass.blur')
  const [glassOpacity] = useConfigState('appearances.glass.opacity')

  // Get game background URL
  const getGameBackgroundUrl = (id: string): string => {
    const info = getAttachmentInfo('game', id, 'images/background.webp')
    return `attachment://game/${id}/images/background.webp?t=${info?.timestamp}`
  }

  // Get custom background URL
  const getCustomBackgroundUrl = (): string => {
    const info = getAttachmentInfo('config', 'media', 'background-1.webp')
    return `attachment://config/media/background-1.webp?t=${info?.timestamp}`
  }

  // Check if custom background is available
  const isCustomBackgroundAvailable = (): boolean => {
    return !getAttachmentInfo('config', 'media', 'background-1.webp')?.error
  }

  // Get recent game ID
  const getRecentGameId = (): string => sortGames('record.lastRunDate', 'desc')[0]

  // Preload image
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = (): void => resolve()
      img.onerror = (error): void => reject(error)
      img.src = url
    })
  }

  // Set new background image URL and preload
  const updateBackgroundImage = (newUrl: string, newGameId: string = ''): void => {
    if (newUrl === currentImageUrl) return

    // Remove isLoading related code
    preloadImage(newUrl)
      .then(() => {
        setCurrentImageUrl(newUrl)
        if (newGameId) setGameId(newGameId)
      })
      .catch(() => {
        // Handle image loading failure
        if (newGameId) {
          setAttachmentError('game', newGameId, 'images/background.webp', true)
        } else if (customBackgroundMode !== 'default') {
          setAttachmentError('config', 'media', 'background.webp', true)
        }
      })
  }

  // Update background when path changes
  useEffect(() => {
    if (pathname.includes('/library/games/')) {
      const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
      updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
    } else if (pathname.includes('/library/collections')) {
      const currentCollectionId = pathname.split('/collections/')[1]?.split('/')[0]

      if (!currentCollectionId) {
        if (isCustomBackgroundAvailable() && customBackgroundMode !== 'default') {
          updateBackgroundImage(getCustomBackgroundUrl())
        } else {
          const recentGameId = getRecentGameId()
          updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)
        }
        return
      }

      const currentGameId = getGameCollectionValue(currentCollectionId, 'games')[0]
      if (currentGameId) {
        updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
      }
    } else {
      if (isCustomBackgroundAvailable() && customBackgroundMode !== 'default') {
        updateBackgroundImage(getCustomBackgroundUrl())
        return
      }

      const recentGameId = getRecentGameId()
      updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)
    }
  }, [pathname, getGameCollectionValue, collections, customBackgroundMode])

  // Update CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity.toString())
    document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`)
  }, [glassOpacity, glassBlur])

  return (
    <div className="absolute top-0 left-0 object-cover w-full h-full pointer-events-none -z-10">
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/[var(--glass-opacity)] via-[63%] via-background/95 to-background/95 backdrop-blur-[var(--glass-blur)] z-10'
        )}
      ></div>

      <TransitionGroup className="w-full h-full">
        <CSSTransition key={currentImageUrl} timeout={250} classNames="background-fade">
          <img
            src={currentImageUrl}
            loading="lazy"
            decoding="async"
            alt=""
            className="absolute top-0 left-0 object-cover w-full h-full"
            onError={() => {
              if (customBackgroundMode) {
                setAttachmentError('config', 'media', 'background.webp', true)
              } else {
                setAttachmentError('game', gameId, 'images/background.webp', true)
              }
            }}
          />
        </CSSTransition>
      </TransitionGroup>
    </div>
  )
}
