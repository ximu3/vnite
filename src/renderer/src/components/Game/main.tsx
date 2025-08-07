import { NSFWBlurLevel } from '@appTypes/models'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { GameImage } from '~/components/ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useConfigState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { ScrollArea } from '../ui/scroll-area'
import { Header } from './Header'
import { HeaderCompact } from './HeaderCompact'
import { Memory } from './Memory'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { useGameDetailStore } from './store'

export function Game({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const headerRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const logoRef = useRef<HTMLDivElement>(null)
  const [headerLayout] = useConfigState('appearances.gameDetail.headerLayout')
  const [showLogo] = useConfigState('appearances.gameDetail.showLogo')

  // Add a ticking variable for requestAnimationFrame
  const ticking = useRef(false)
  // Store the current scroll position to avoid re-querying the DOM in the rAF callback
  const currentScrollTop = useRef(0)

  const isEditingLogo = useGameDetailStore((state) => state.isEditingLogo)
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)

  // Game Logo position and size management
  const initialPosition = { x: 1.5, y: 35 }
  const initialPositionInCompact = { x: 70, y: 5 } // Adjusted for compact header
  const initialSize = 100
  const [logoPosition, setLogoPosition, saveLogoPosition] = useGameState(
    gameId,
    'apperance.logo.position',
    true
  )
  const [logoSize, setLogoSize, saveLogoSize] = useGameState(gameId, 'apperance.logo.size', true)
  const [logoVisible, setLogoVisible] = useGameState(gameId, 'apperance.logo.visible')
  const [localLogoPosition, setLocalLogoPosition] = useState(initialPosition)

  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const hideLogo = nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImage

  useEffect(() => {
    setLocalLogoPosition(logoPosition)
  }, [logoPosition])

  // Logo-related handler functions
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
      setLogoPosition(localLogoPosition)
    }
    setDragging(false)
  }

  const handleReset = async (): Promise<void> => {
    setLocalLogoPosition(initialPosition)
    setLogoPosition(initialPosition)
  }

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

  // Use requestAnimationFrame for smoother updates
  const updateLogoPosition = (): void => {
    if (logoRef.current && logoVisible) {
      logoRef.current.style.transform = `translateY(-${currentScrollTop.current * 1.3}px) scale(${logoSize / 100})`
    }
    ticking.current = false
  }

  // Reset scroll position when gameId changes
  useEffect(() => {
    // Reset scroll position
    currentScrollTop.current = 0

    // Find and reset the scroll container's position
    if (scrollAreaRef.current) {
      const viewportElement = scrollAreaRef.current.querySelector('[class*="size-full"]')
      if (viewportElement) {
        ;(viewportElement as HTMLElement).scrollTop = 0
      }
    }
  }, [gameId])

  // Scroll handling with imperative updates and requestAnimationFrame
  useEffect(() => {
    if (!scrollAreaRef.current) return

    const viewportElement = scrollAreaRef.current.querySelector('[class*="size-full"]')

    if (!viewportElement) {
      console.error('ScrollArea viewport element not found')
      return
    }

    const handleScroll = (): void => {
      // Store the current scroll position
      currentScrollTop.current = (viewportElement as HTMLElement).scrollTop

      // Use requestAnimationFrame for smoother updates
      if (!ticking.current) {
        window.requestAnimationFrame(updateLogoPosition)
        ticking.current = true
      }

      // Dispatch a custom event to notify Light components of the scroll position
      window.dispatchEvent(
        new CustomEvent('game-scroll', {
          detail: { scrollY: currentScrollTop.current }
        })
      )
    }

    viewportElement.addEventListener('scroll', handleScroll)
    // Add a class name so that Light components can find the scrollable element
    viewportElement.classList.add('scrollable-content')

    return (): void => {
      viewportElement.removeEventListener('scroll', handleScroll)
    }
  }, [logoSize, logoVisible])

  // Mouse event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return (): void => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, localLogoPosition])

  const isInitialPosition = (pos: { x: number; y: number }): boolean =>
    pos.x === initialPosition.x && pos.y === initialPosition.y

  return (
    <div className={cn('w-full h-full relative overflow-hidden shrink-0')}>
      {/* Logo Editing Control Panel */}
      {/* Only visible when editing logo */}
      {showLogo && isEditingLogo && !hideLogo && (
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
            onClick={() => {
              setIsEditingLogo(false)
              saveLogoPosition()
              saveLogoSize()
            }}
          >
            {t('utils:common.confirm')}
          </Button>
        </div>
      )}

      {/* Logo Layer */}
      {showLogo && logoVisible && !hideLogo && (
        <div
          ref={logoRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{
            transform: `scale(${logoSize / 100})`,
            left: `${headerLayout === 'compact' && isInitialPosition(localLogoPosition) ? initialPositionInCompact.x : localLogoPosition.x}vw`,
            top: `${headerLayout === 'compact' && isInitialPosition(localLogoPosition) ? initialPositionInCompact.y : localLogoPosition.y}vh`,
            cursor: dragging ? 'grabbing' : 'grab',
            transformOrigin: 'center center',
            zIndex: isEditingLogo ? 30 : 10 // Increase z-index in editing mode
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

      {/* Scrollable Content Area */}
      <ScrollArea
        ref={scrollAreaRef}
        className={cn(
          'relative h-full w-full overflow-auto rounded-none',
          headerLayout === 'compact' && 'py-5 lg:px-5 px-3'
        )}
      >
        {/* Content Container */}
        <div className={cn('relative z-20 flex flex-col w-full min-h-[100vh]')}>
          <div className={`mt-(--content-top-padding)`}>
            {/* Header Area */}
            <div ref={headerRef} className="pt-1">
              {headerLayout === 'compact' ? (
                <HeaderCompact gameId={gameId} />
              ) : (
                <Header gameId={gameId} />
              )}
            </div>

            {/* Content Area */}
            <div className={cn('p-7 pt-4 h-full')}>
              <Tabs defaultValue="overview" className={cn('w-full')}>
                <TabsList className={cn('w-full justify-start bg-transparent')} variant="underline">
                  <TabsTrigger className={cn('w-1/4')} value="overview" variant="underline">
                    {t('detail.tabs.overview')}
                  </TabsTrigger>
                  <TabsTrigger className={cn('w-1/4')} value="record" variant="underline">
                    {t('detail.tabs.record')}
                  </TabsTrigger>
                  <TabsTrigger className={cn('w-1/4')} value="save" variant="underline">
                    {t('detail.tabs.save')}
                  </TabsTrigger>
                  <TabsTrigger className={cn('w-1/4')} value="memory" variant="underline">
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
      </ScrollArea>
    </div>
  )
}
