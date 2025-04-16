import { cn } from '~/utils'
import { GameImage } from '@ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@ui/context-menu'
import { toast } from 'sonner'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { Header } from './Header'
import { Memory } from './Memory'
import { useState, useEffect, useRef } from 'react'
import { throttle } from 'lodash'
import { useGameState } from '~/hooks'
import { useTranslation } from 'react-i18next'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [isImageError, setIsImageError] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const [scrollY, setScrollY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const logoRef = useRef<HTMLDivElement>(null)

  const initialPosition = { x: 2, y: 26 }
  const initialSize = 100

  const [logoPosition, setLogoPosition] = useGameState(gameId, 'apperance.logo.position')
  const [logoSize, setLogoSize] = useGameState(gameId, 'apperance.logo.size')
  const [logoVisible, setLogoVisible] = useGameState(gameId, 'apperance.logo.visible')

  // Handling wheel events
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (!logoRef.current) return

    const delta = e.deltaY * -0.01
    const newSize = Math.min(Math.max(logoSize + delta * 5, 30), 200) // Limit size to between 30% and 200%
    setLogoSize(newSize)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (!logoRef.current) return
    if (e.button === 0) {
      setDragging(true)
      offset.current = {
        x: e.clientX - (logoPosition.x * window.innerWidth) / 100,
        y: e.clientY - (logoPosition.y * window.innerHeight) / 100
      }
    }
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (dragging && logoRef.current) {
      setLogoPosition({
        x: ((e.clientX - offset.current.x) * 100) / window.innerWidth,
        y: ((e.clientY - offset.current.y) * 100) / window.innerHeight
      })
    }
  }

  const handleMouseUp = (): void => {
    setDragging(false)
  }

  const handleReset = (): void => {
    setLogoPosition(initialPosition)
  }

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return (): void => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  useEffect(() => {
    const handleScroll = (e: any): void => {
      // Get the scroll position of the scroll container
      const scrollContainer = e.target
      setScrollY(scrollContainer.scrollTop)
    }

    // Find the scroll container and add a listener
    const scrollContainer = document.querySelector('.scrollbar-base')
    scrollContainer?.addEventListener('scroll', handleScroll)

    return (): void => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const scrollContainer = headerRef.current?.closest('.scrollbar-base')
    if (!scrollContainer) return

    const handleScroll = throttle(() => {
      if (!headerRef.current) return

      const scrollTop = scrollContainer.scrollTop
      const vh40 = window.innerHeight * 0.4
      const buffer = 100 // Add a buffer to prevent repeated switching at critical points

      // Adding a hysteresis effect
      if (!isSticky && scrollTop > vh40) {
        setIsSticky(true)
      } else if (isSticky && scrollTop < vh40 + buffer - 100) {
        setIsSticky(false)
      }

      lastScrollTop.current = scrollTop
    }, 100)

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    handleScroll()

    return (): void => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      handleScroll.cancel()
    }
  }, [isSticky])

  return (
    <div className={cn('w-full h-full pb-7 relative overflow-hidden')}>
      <div className={cn(!isImageError ? 'pt-[30px]' : 'pt-[30px] border-b-[1px]')}></div>
      <div className={cn('absolute top-0 h-[30px] w-full bg-background z-20')}></div>
      {/* Background Image Layer - Absolute */}
      <div
        className={cn(
          'absolute inset-0 w-full h-full max-h-[84vh] overflow-hidden pt-[30px] pr-2',
          'will-change-transform'
        )}
        style={{
          transform: `translateY(-${scrollY * 0.4}px)`
        }}
      >
        <GameImage
          gameId={gameId}
          key={`${gameId}-background-1`}
          type="background"
          className={cn('w-full h-auto max-h-[84vh] object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
        <GameImage
          gameId={gameId}
          key={`${gameId}-background-2`}
          type="background"
          flips
          className={cn('w-full h-auto max-h-[84vh] object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
      </div>

      {logoVisible && (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={logoRef}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              style={{
                transform: `translateY(-${scrollY * 0.7}px) scale(${logoSize / 100})`,
                left: `${logoPosition.x}vw`,
                top: `${logoPosition.y}vh`,
                cursor: dragging ? 'grabbing' : 'grab',
                transformOrigin: 'center center'
              }}
              className={cn('absolute', 'will-change-transform', 'z-10')}
            >
              <GameImage
                gameId={gameId}
                key={`${gameId}-logo`}
                type="logo"
                className={cn('w-auto max-h-[15vh] object-contain')}
                fallback={<div className={cn('')} />}
              />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleReset}>
              {' '}
              {t('detail.logoContextMenu.resetPosition')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setLogoSize(initialSize)}>
              {' '}
              {t('detail.logoContextMenu.resetSize')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setLogoVisible(false)
                toast.info(t('detail.notifications.logoHidden'))
              }}
            >
              {t('detail.logoContextMenu.hideLogo')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
      {/* Scrollable Content */}
      <div
        className={cn(
          'relative h-full w-full overflow-auto scrollbar-base scrollbar-track-background'
        )}
      >
        {/* Spacer to push content down */}
        <div className={cn('h-[40vh]')} />

        {/* content container */}
        <div className={cn('relative z-20 flex flex-col w-full')}>
          {/* Header with sticky positioning */}
          <div ref={headerRef} className={cn('sticky top-0 z-30 w-full')}>
            <Header gameId={gameId} className={cn('w-full')} isSticky={isSticky} />
          </div>

          <div
            className={cn('p-7 pt-[6px] bg-background', 'duration-100', isSticky && '-mt-12 pt-12')}
          >
            <Tabs defaultValue="overview" className={cn('w-full')}>
              <TabsList className={cn('w-[370px] shadow-md bg-accent/30')}>
                <TabsTrigger className={cn('w-1/4')} value="overview">
                  {t('detail.tabs.overview')}
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/4')} value="record">
                  {t('detail.tabs.record')}
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/4')} value="save">
                  {t('detail.tabs.save')}
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/4')} value="memory">
                  {t('detail.tabs.memory')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Overview gameId={gameId} />
              </TabsContent>
              <TabsContent value="record">
                <Record gameId={gameId} />
              </TabsContent>
              <TabsContent value="save">
                <Save gameId={gameId} />
              </TabsContent>
              <TabsContent value="memory">
                <Memory gameId={gameId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
