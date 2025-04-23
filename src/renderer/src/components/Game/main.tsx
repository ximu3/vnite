import { cn } from '~/utils'
import { useGameState } from '~/hooks'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { GameImage } from '@ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@ui/context-menu'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { Memory } from './Memory'
import { Header } from './Header'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [_isImageError, setIsImageError] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const logoRef = useRef<HTMLDivElement>(null)

  // Game settings-related state
  const initialPosition = { x: 2, y: 26 }
  const initialSize = 100
  const [logoPosition, setLogoPosition] = useGameState(gameId, 'apperance.logo.position')
  const [logoSize, setLogoSize] = useGameState(gameId, 'apperance.logo.size')
  const [logoVisible, setLogoVisible] = useGameState(gameId, 'apperance.logo.visible')

  // Logo-related handler functions
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (!logoRef.current) return

    const delta = e.deltaY * -0.01
    const newSize = Math.min(Math.max(logoSize + delta * 5, 30), 200) // Limit size between 30% and 200%
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

  // Scroll handling
  useEffect(() => {
    const handleScroll = (e: any): void => {
      const scrollContainer = e.target
      setScrollY(scrollContainer.scrollTop)
    }

    const scrollContainer = document.querySelector('.scrollbar-base')
    scrollContainer?.addEventListener('scroll', handleScroll)

    return (): void => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mouse event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return (): void => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  return (
    <div className={cn('w-full h-full relative overflow-hidden shadow-inner')}>
      {/* Background layer - absolute positioning */}
      <div
        className={cn(
          'absolute inset-0 w-full h-full overflow-hidden pr-2',
          'will-change-transform max-h-[calc(80vh-30px)]'
        )}
        style={{
          transform: `translateY(-${scrollY * 0.4}px)`
        }}
      >
        <GameImage
          gameId={gameId}
          key={`${gameId}-background-1`}
          type="background"
          className={cn('w-full h-auto object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
        <GameImage
          gameId={gameId}
          key={`${gameId}-background-2`}
          type="background"
          flips
          className={cn('w-full h-auto object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
      </div>

      {/* Logo layer */}
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
              {t('detail.logoContextMenu.resetPosition')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setLogoSize(initialSize)}>
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

      {/* Scrollable content area */}
      <div
        className={cn(
          'relative h-full w-full overflow-auto scrollbar-base scrollbar-track-background rounded-none'
        )}
      >
        {/* Top space */}
        <div className="relative h-[40vh]">
          {/* Left side gradient blur */}
          <div
            className={cn(
              'absolute top-0 bottom-0 left-0 w-[50px] bg-gradient-to-r from-background/[0.7] to-transparent',
              'backdrop-blur-xl'
            )}
            style={{
              maskImage: 'linear-gradient(to right, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
            }}
          ></div>

          {/* Right side gradient blur */}
          <div
            className={cn(
              'absolute top-0 bottom-0 right-0 w-[50px] bg-gradient-to-l from-background/[0.7] to-transparent',
              'backdrop-blur-xl'
            )}
            style={{
              maskImage: 'linear-gradient(to left, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
            }}
          ></div>
        </div>

        {/* Content container */}
        <div
          className={cn(
            'relative z-20 flex flex-col w-full bg-background/[0.9] min-h-[calc(60vh-30px)] backdrop-blur-2xl'
          )}
        >
          {/* Header area */}
          <div ref={headerRef}>
            <Header gameId={gameId} />
          </div>

          {/* Content area */}
          <div className={cn('p-7 pt-0')}>
            <Tabs defaultValue="overview" className={cn('w-full')}>
              <TabsList
                className={cn(
                  'w-[500px] shadow-md bg-accent/[0.2] justify-start border-border/[0.5] border'
                )}
              >
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
