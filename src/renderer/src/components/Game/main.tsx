import { cn } from '~/utils'
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
import { Header } from './Header'
import { useState, useEffect, useRef } from 'react'
import { throttle } from 'lodash'
import { useDBSyncedState } from '~/hooks'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const [isImageError, setIsImageError] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const [scrollY, setScrollY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const logoRef = useRef<HTMLDivElement>(null)

  const initialPosition = { x: 2, y: 29 }
  const [logoPosition, setLogoPosition] = useDBSyncedState(
    initialPosition,
    `games/${gameId}/utils.json`,
    ['logoPosition']
  )

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
      const vh45 = window.innerHeight * 0.45
      const buffer = 200 // Add a buffer to prevent repeated switching at critical points

      // Adding a hysteresis effect
      if (!isSticky && scrollTop > vh45 + buffer) {
        setIsSticky(true)
      } else if (isSticky && scrollTop < vh45 + buffer - 100) {
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
        className={cn('absolute inset-0 w-full h-full pt-[30px] pr-2', 'will-change-transform')}
        style={{
          transform: `translateY(-${scrollY * 0.4}px)`
        }}
      >
        <GameImage
          gameId={gameId}
          key={`${gameId}-background`}
          type="background"
          className={cn('w-full h-auto max-h-[90vh] object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
      </div>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={logoRef}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translateY(-${scrollY * 0.7}px)`,
              left: `${logoPosition.x}vw`,
              top: `${logoPosition.y}vh`,
              cursor: dragging ? 'grabbing' : 'grab'
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
          <ContextMenuItem onClick={handleReset}>重置</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {/* Scrollable Content */}
      <div className={cn('relative h-full overflow-auto scrollbar-base')}>
        {/* Spacer to push content down */}
        <div className={cn('h-[45vh]')} />

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
              <TabsList className={cn('w-[250px] shadow-md bg-accent/30')}>
                <TabsTrigger className={cn('w-1/3')} value="overview">
                  概览
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/3')} value="record">
                  记录
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/3')} value="save">
                  存档
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
