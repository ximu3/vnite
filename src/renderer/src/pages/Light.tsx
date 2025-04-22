import { useLocation } from 'react-router-dom'
import { sortGames, useGameCollectionStore } from '~/stores/game'
import { useEffect, useState } from 'react'
import { useAttachmentStore } from '~/stores'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'

export function Light(): JSX.Element {
  const { pathname } = useLocation()
  const [gameId, setGameId] = useState<string>('')
  const [attachmentUrl, setAttachmentUrl] = useState<string>('')
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const getGameCollectionValue = useGameCollectionStore((state) => state.getGameCollectionValue)
  const collections = useGameCollectionStore((state) => state.documents)
  const [customBackground] = useConfigState('appearances.background.customBackground')
  const [glassBlur] = useConfigState('appearances.glass.blur')
  const [glassOpacity] = useConfigState('appearances.glass.opacity')

  const getGameBackgroundUrl = (id: string): string => {
    const info = getAttachmentInfo('game', id, 'images/background.webp')
    return `attachment://game/${id}/images/background.webp?t=${info?.timestamp}`
  }

  const getCustomBackgroundUrl = (): string => {
    const info = getAttachmentInfo('config', 'media', 'background.webp')
    return `attachment://config/media/background.webp?t=${info?.timestamp}`
  }

  const isCustomBackgroundAvailable = (): boolean => {
    return customBackground && !getAttachmentInfo('config', 'media', 'background.webp')?.error
  }

  const getRecentGameId = (): string => sortGames('record.lastRunDate', 'desc')[0]

  useEffect(() => {
    if (pathname.includes('/library/games/')) {
      const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
      setGameId(currentGameId)
      setAttachmentUrl(getGameBackgroundUrl(currentGameId))
    } else if (pathname.includes('/library/collections')) {
      const currentCollectionId = pathname.split('/collections/')[1]?.split('/')[0]
      if (!currentCollectionId) {
        if (isCustomBackgroundAvailable()) {
          setAttachmentUrl(getCustomBackgroundUrl())
          return
        } else {
          const recentGameId = getRecentGameId()
          setGameId(recentGameId)
          setAttachmentUrl(getGameBackgroundUrl(recentGameId))
        }
      }
      const currentGameId = getGameCollectionValue(currentCollectionId, 'games')[0]
      setGameId(currentGameId)
      setAttachmentUrl(getGameBackgroundUrl(currentGameId))
    } else {
      if (isCustomBackgroundAvailable()) {
        setAttachmentUrl(getCustomBackgroundUrl())
        return
      }
      const recentGameId = getRecentGameId()
      setGameId(recentGameId)
      setAttachmentUrl(getGameBackgroundUrl(recentGameId))
    }
  }, [pathname, getGameCollectionValue, collections])

  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity.toString())
    document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`)
  }, [glassOpacity, glassBlur])

  return (
    <div className="absolute top-0 left-0 object-cover w-full h-full pointer-events-none">
      <img
        src={attachmentUrl}
        loading="lazy"
        decoding="async"
        className="object-cover w-full h-full transition-all duration-300"
        onError={(_e) => {
          if (customBackground) {
            setAttachmentError('config', 'media', 'background.webp', true)
          } else {
            setAttachmentError('game', gameId, `images/background.webp`, true)
          }
        }}
      />
    </div>
  )
}
