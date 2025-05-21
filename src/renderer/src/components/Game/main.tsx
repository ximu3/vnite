import { Button } from '@ui/button'
import { GameImage } from '@ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { Header } from './Header'
import { Memory } from './Memory'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { useGameDetailStore } from './store'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [_isImageError, setIsImageError] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const logoRef = useRef<HTMLDivElement>(null)

  const isEditingLogo = useGameDetailStore((state) => state.isEditingLogo)
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)

  // Game settings-related state
  const initialPosition = { x: 1.5, y: 24 }
  const initialSize = 100
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const [logoPosition, setLogoPosition] = useGameState(gameId, 'apperance.logo.position')
  const [logoSize, setLogoSize] = useGameState(gameId, 'apperance.logo.size')
  const [logoVisible, setLogoVisible] = useGameState(gameId, 'apperance.logo.visible')

  const [localLogoPosition, setLocalLogoPosition] = useState(initialPosition)

  useEffect(() => {
    setLocalLogoPosition(logoPosition)
  }, [logoPosition])

  const handleMouseMove = (e: MouseEvent): void => {
    if (dragging && logoRef.current) {
      setLocalLogoPosition({
        x: ((e.clientX - offset.current.x) * 100) / window.innerWidth,
        y: ((e.clientY - offset.current.y) * 100) / window.innerHeight
      })
    }
  }

  const handleMouseUp = async (): Promise<void> => {
    if (dragging) {
      await setLogoPosition(localLogoPosition)
    }
    setDragging(false)
  }

  const handleReset = async (): Promise<void> => {
    setLocalLogoPosition(initialPosition)
    await setLogoPosition(initialPosition)
  }

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
        x: e.clientX - (localLogoPosition.x * window.innerWidth) / 100,
        y: e.clientY - (localLogoPosition.y * window.innerHeight) / 100
      }
    }
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
  }, [dragging, localLogoPosition])

  return (
    <div className={cn('w-full h-full relative overflow-hidden')}>
      {/* Background layer - absolute positioning */}
      <div
        className={cn(
          'absolute inset-0 w-full h-full overflow-hidden pr-2',
          'will-change-transform'
        )}
        style={{
          transform: `translateY(-${scrollY * 0.4}px)`,
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 85%)'
        }}
      >
        <GameImage
          gameId={gameId}
          key={`${gameId}-background-1`}
          type="background"
          blur={nsfw && enableNSFWBlur}
          className={cn('w-full h-auto object-cover z-[1]')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
          style={{
            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
          }}
        />
        <GameImage
          gameId={gameId}
          key={`${gameId}-background-2`}
          type="background"
          className={cn('w-full h-full absolute top-0 object-cover z-0')}
          style={{
            opacity: 0.3
          }}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
      </div>

      {/* Logo editing control panel - displayed when in edit mode */}
      {isEditingLogo && (
        <div
          className={cn(
            'absolute top-[10px] left-[10px] z-40 bg-transparent p-3 rounded-lg flex gap-3'
          )}
        >
          <Button
            variant={'default'}
            className={cn('bg-primary hover:bg-primary/95')}
            onClick={handleReset}
          >
            {t('detail.logoManagePanel.resetPosition')}
          </Button>
          <Button
            variant={'default'}
            className={cn('bg-primary hover:bg-primary/95')}
            onClick={() => setLogoSize(initialSize)}
          >
            {t('detail.logoManagePanel.resetSize')}
          </Button>
          {logoVisible ? (
            <Button
              variant={'default'}
              className={cn('bg-primary hover:bg-primary/95')}
              onClick={() => {
                setLogoVisible(false)
              }}
            >
              {t('detail.logoManagePanel.hideLogo')}
            </Button>
          ) : (
            <Button
              variant={'default'}
              className={cn('bg-primary hover:bg-primary/95')}
              onClick={() => {
                setLogoVisible(true)
              }}
            >
              {t('detail.logoManagePanel.showLogo')}
            </Button>
          )}
          <Button
            variant={'default'}
            className={cn('bg-primary hover:bg-primary/95')}
            onClick={() => setIsEditingLogo(false)}
          >
            {t('utils:common.confirm')}
          </Button>
        </div>
      )}

      {/* Logo layer */}
      {logoVisible && (
        <div
          ref={logoRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{
            transform: `translateY(-${scrollY * 0.7}px) scale(${logoSize / 100})`,
            left: `${localLogoPosition.x}vw`,
            top: `${localLogoPosition.y}vh`,
            cursor: dragging ? 'grabbing' : 'grab',
            transformOrigin: 'center center',
            zIndex: isEditingLogo ? 30 : 10 // elevated z-index in edit mode
          }}
          className={cn('absolute', 'will-change-transform')}
        >
          <GameImage
            gameId={gameId}
            key={`${gameId}-logo`}
            type="logo"
            className={cn('w-auto max-h-[15vh] object-contain')}
            fallback={<div className={cn('')} />}
          />
        </div>
      )}

      {/* Scrollable content area */}
      <div
        className={cn(
          'relative h-full w-full overflow-auto scrollbar-base scrollbar-track-background rounded-none'
        )}
      >
        {/* Content container */}
        <div
          className={cn('relative z-20 flex flex-col w-full min-h-[100vh]')}
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.95) 63vh, hsl(var(--background) / 0.95) 100%)'
          }}
        >
          {/* Header area */}
          <div ref={headerRef} className="mt-[40vh]">
            <Header gameId={gameId} />
          </div>

          {/* Content area */}
          <div className={cn('p-7 pt-0 h-full')}>
            <Tabs defaultValue="overview" className={cn('w-full')}>
              <TabsList className={cn('w-[500px] justify-start')}>
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
