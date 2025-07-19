import { Button } from '~/components/ui/button'
import { GameImage } from '~/components/ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { Header } from './Header'
import { Memory } from './Memory'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { useGameDetailStore } from './store'
import { ScrollArea } from '../ui/scroll-area'

export function Game({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const headerRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const logoRef = useRef<HTMLDivElement>(null)

  const isEditingLogo = useGameDetailStore((state) => state.isEditingLogo)
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)

  // Game settings-related state
  const initialPosition = { x: 1.5, y: 24 }
  const initialSize = 100
  const [logoPosition, setLogoPosition, saveLogoPosition] = useGameState(
    gameId,
    'apperance.logo.position',
    true
  )
  const [logoSize, setLogoSize, saveLogoSize] = useGameState(gameId, 'apperance.logo.size', true)
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
      setLogoPosition(localLogoPosition)
    }
    setDragging(false)
  }

  const handleReset = async (): Promise<void> => {
    setLocalLogoPosition(initialPosition)
    setLogoPosition(initialPosition)
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
    if (!scrollAreaRef.current) return

    const viewportElement = scrollAreaRef.current.querySelector('[class*="size-full"]')

    if (!viewportElement) {
      console.error('ScrollArea viewport element not found')
      return
    }

    const handleScroll = (): void => {
      const scrollTop = (viewportElement as HTMLElement).scrollTop
      setScrollY(scrollTop)

      // 触发自定义事件，通知Light组件进行视差滚动
      window.dispatchEvent(
        new CustomEvent('game-scroll', {
          detail: { scrollY: scrollTop }
        })
      )
    }

    viewportElement.addEventListener('scroll', handleScroll)
    // 添加类名以便Light组件能找到滚动元素
    viewportElement.classList.add('scrollable-content')

    return (): void => {
      viewportElement.removeEventListener('scroll', handleScroll)
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
      {/* 背景层已移至Light组件 */}

      {/* Logo编辑控制面板 - 仅在编辑模式下显示 */}
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

      {/* Logo层 */}
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
            zIndex: isEditingLogo ? 30 : 10 // 编辑模式下提高z-index
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

      {/* 可滚动内容区域 */}
      <ScrollArea
        ref={scrollAreaRef}
        className={cn('relative h-full w-full overflow-auto rounded-none')}
      >
        {/* 内容容器 */}
        <div
          className={cn('relative z-20 flex flex-col w-full min-h-[100vh]')}
          // 背景渐变已移除，由Light组件处理
        >
          <div className="mt-[36vh]">
            {/* 头部区域 */}
            <div ref={headerRef} className="pt-1">
              <Header gameId={gameId} />
            </div>

            {/* 内容区域 */}
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
