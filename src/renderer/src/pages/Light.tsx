import { useEffect, useState, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useConfigState, useGameState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
import { sortGames, useGameCollectionStore } from '~/stores/game'
import { CrossfadeImage } from '@ui/cross-fade-image'
import { cn } from '~/utils'
import { useTheme } from '~/components/ThemeProvider'
import { create } from 'zustand'

// eslint-disable-next-line
export const useLightStore = create<{
  refreshId: number
  refresh: () => void
}>((set) => ({
  refreshId: 0,
  refresh: () => set((state) => ({ refreshId: state.refreshId + 1 }))
}))

export function Light(): React.JSX.Element {
  const { pathname } = useLocation()
  const [gameId, setGameId] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [scrollY, setScrollY] = useState(0)
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const getGameCollectionValue = useGameCollectionStore((state) => state.getGameCollectionValue)
  const collections = useGameCollectionStore((state) => state.documents)
  const [customBackground] = useConfigState('appearances.background.customBackground')
  const [darkGlassBlur] = useConfigState('appearances.glass.dark.blur')
  const [darkGlassOpacity] = useConfigState('appearances.glass.dark.opacity')
  const [lightGlassBlur] = useConfigState('appearances.glass.light.blur')
  const [lightGlassOpacity] = useConfigState('appearances.glass.light.opacity')
  const [glassBlur, setGlassBlur] = useState(darkGlassBlur)
  const [glassOpacity, setGlassOpacity] = useState(darkGlassOpacity)
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const detailBackgroundRef = useRef<HTMLDivElement>(null)
  const { isDark } = useTheme()
  const refreshId = useLightStore((state) => state.refreshId)

  useEffect(() => {
    // Set initial background based on the current theme
    if (isDark) {
      setGlassBlur(darkGlassBlur)
      setGlassOpacity(darkGlassOpacity)
    } else {
      setGlassBlur(lightGlassBlur)
      setGlassOpacity(lightGlassOpacity)
    }
  }, [isDark, darkGlassBlur, darkGlassOpacity, lightGlassBlur, lightGlassOpacity])

  const getGameBackgroundUrl = (id: string): string => {
    const info = getAttachmentInfo('game', id, 'images/background.webp')
    return `attachment://game/${id}/images/background.webp?t=${info?.timestamp}`
  }

  const getCustomBackgroundUrl = (): string => {
    const info = getAttachmentInfo(
      'config',
      'media',
      `background-${isDark ? 'dark' : 'light'}.webp`
    )
    return `attachment://config/media/background-${isDark ? 'dark' : 'light'}.webp?t=${info?.timestamp}`
  }

  const isCustomBackgroundAvailable = (): boolean => {
    return (
      customBackground &&
      !getAttachmentInfo('config', 'media', `background-${isDark ? 'dark' : 'light'}.webp`)?.error
    )
  }

  const getRecentGameId = (): string => sortGames('record.lastRunDate', 'desc')[0]

  const updateBackgroundImage = (newUrl: string, newGameId: string = ''): void => {
    if (newUrl === imageUrl) return

    setImageUrl(newUrl)
    if (newGameId) setGameId(newGameId)
  }

  // Handle scroll events
  useEffect(() => {
    const handleScroll = (e: Event): void => {
      // Get the scroll element
      const scrollElement = e.target as HTMLElement

      // Calculate scroll position, limiting the minimum to 0 (to prevent scrolling up beyond the top)
      const currentScrollY = Math.max(0, scrollElement.scrollTop)
      setScrollY(currentScrollY)
    }

    // Listen for custom events
    const handleGameScroll = (e: CustomEvent): void => {
      const currentScrollY = e.detail?.scrollY || 0
      setScrollY(currentScrollY)
    }

    // Listen for custom events
    window.addEventListener('game-scroll', handleGameScroll as EventListener)

    // Listen for scroll events on the document
    document.addEventListener('scroll', handleScroll)

    // Listen for scroll events on all elements marked as scrollable
    document.querySelectorAll('.scrollable-content').forEach((el) => {
      el.addEventListener('scroll', handleScroll)
    })

    return (): void => {
      window.removeEventListener('game-scroll', handleGameScroll as EventListener)
      document.removeEventListener('scroll', handleScroll)
      document.querySelectorAll('.scrollable-content').forEach((el) => {
        el.removeEventListener('scroll', handleScroll)
      })
    }
  }, [])

  // Update background image based on the current route
  useEffect(() => {
    if (pathname.includes('/library/games/')) {
      const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
      updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
    } else if (pathname.includes('/library/collections')) {
      const currentCollectionId = pathname.split('/collections/')[1]?.split('/')[0]

      if (!currentCollectionId) {
        if (isCustomBackgroundAvailable()) {
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
      if (isCustomBackgroundAvailable()) {
        updateBackgroundImage(getCustomBackgroundUrl())
        return
      }

      const recentGameId = getRecentGameId()
      updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)
    }
  }, [
    pathname,
    getGameCollectionValue,
    collections,
    customBackground,
    isDark,
    refreshId,
    getAttachmentInfo
  ])

  // Update CSS variables for glass effect
  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity * 100 + '%')
    document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`)
  }, [glassOpacity, glassBlur])

  // Check if the game detail page background should be shown
  const isGameDetailRoute = pathname.includes('/library/games/') && gameId !== ''

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
      {/* Game detail page specific background layer - only shown on games route */}
      {isGameDetailRoute && (
        <div
          ref={detailBackgroundRef}
          className={cn('absolute overflow-hidden', 'will-change-transform')}
          style={{
            left: '327px',
            top: '50px',
            width: 'calc(100% - 327px)',
            height: 'calc(100% - 50px)',
            zIndex: 15,
            clipPath: 'inset(0 0 0 0)' // Ensure content does not overflow this container
          }}
        >
          {/* Internal container for parallax scrolling effect */}
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `translateY(-${scrollY * 0.4}px)`,
              maskImage: 'linear-gradient(to bottom, black 30%, transparent 70%)'
            }}
          >
            <CrossfadeImage
              src={imageUrl}
              className={cn('w-full h-auto max-h-[55vh] object-top object-cover')}
              blur={enableNSFWBlur && nsfw}
              duration={500}
              onError={() => {
                if (customBackground) {
                  setAttachmentError('config', 'media', 'background.webp', true)
                } else {
                  setAttachmentError('game', gameId, 'images/background.webp', true)
                }
              }}
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Glass effect layer */}
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-full bg-background/[var(--glass-opacity)] backdrop-filter backdrop-blur-[var(--glass-blur)] z-10'
        )}
      ></div>

      {/* Background image layer */}
      <CrossfadeImage
        src={imageUrl}
        className="w-full h-full"
        duration={500}
        onError={() => {
          if (customBackground) {
            setAttachmentError('config', 'media', 'background.webp', true)
          } else {
            setAttachmentError('game', gameId, 'images/background.webp', true)
          }
        }}
      />
    </div>
  )
}
