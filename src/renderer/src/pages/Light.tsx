import { useLocation } from 'react-router-dom'
import { sortGames, useGameCollectionStore } from '~/stores/game'
import { useEffect, useState } from 'react'
import { useAttachmentStore } from '~/stores'

export function Light(): JSX.Element {
  const { pathname } = useLocation()
  const [gameId, setGameId] = useState<string>('')
  const { getAttachmentInfo } = useAttachmentStore()
  const getGameCollectionValue = useGameCollectionStore((state) => state.getGameCollectionValue)
  const collections = useGameCollectionStore((state) => state.documents)

  const attachmentInfo = getAttachmentInfo('game', gameId, `images/background.webp`)

  const attachmentUrl = `attachment://game/${gameId}/images/background.webp?t=${
    attachmentInfo?.timestamp
  }`

  useEffect(() => {
    if (pathname.includes('/library/games/')) {
      const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
      setGameId(currentGameId)
    } else if (pathname.includes('/library/collections')) {
      const currentCollectionId = pathname.split('/collections/')[1]?.split('/')[0]
      if (!currentCollectionId) {
        const currentGameId = sortGames('record.lastRunDate', 'desc')[0]
        setGameId(currentGameId)
        return
      }
      const currentGameId = getGameCollectionValue(currentCollectionId, 'games')[0]
      setGameId(currentGameId)
    } else {
      const currentGameId = sortGames('record.lastRunDate', 'desc')[0]
      setGameId(currentGameId)
    }
  }, [pathname, getGameCollectionValue, collections])

  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity.toString())
    document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`)
  }, [glassOpacity, glassBlur])

  return (
    <div className="absolute top-0 left-0 object-cover w-full h-full pointer-events-none">
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/[var(--glass-opacity)] via-60% via-background to-background backdrop-blur-[var(--glass-blur)]'
        )}
      ></div>
      <img
        src={attachmentUrl}
        loading="lazy"
        decoding="async"
        className="object-cover w-full h-full transition-all duration-300"
      />
    </div>
  )
}
