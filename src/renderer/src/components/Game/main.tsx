import { cn } from '~/utils'
import { GameImage } from '@ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { Header } from './Header'
import { useState, useEffect, useRef } from 'react'
import { throttle } from 'lodash'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const [isImageError, setIsImageError] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)

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

    scrollContainer.addEventListener('scroll', handleScroll)

    handleScroll()

    return (): void => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      handleScroll.cancel()
    }
  }, [isSticky])

  return (
    <div className={cn('w-full h-full pb-7 relative overflow-hidden')}>
      <div className={cn(!isImageError ? 'pt-[30px]' : 'pt-[30px] border-b-[1px]')}></div>

      {/* Background Image Layer - Absolute */}
      <div className={cn('absolute inset-0 w-full h-full pt-[30px] pr-2')}>
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

          <div className={cn('p-7 pt-3 bg-background', 'duration-100', isSticky && '-mt-12 pt-12')}>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={cn('w-[250px] bg-muted/90')}>
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
