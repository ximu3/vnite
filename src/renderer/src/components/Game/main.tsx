import { NSFWBlurLevel } from '@appTypes/models'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '~/components/ui/context-menu'
import { GameImage } from '~/components/ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useConfigState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { ScrollArea } from '../ui/scroll-area'
import { PlayTimeEditorDialog } from './Config/ManageMenu/PlayTimeEditorDialog'
import { ScoreEditorDialog } from './Config/ManageMenu/ScoreEditorDialog'
import { GamePropertiesDialog } from './Config/Properties'
import { ImageViewerDialog } from './Config/Properties/Media/ImageViewerDialog'
import { Header } from './Header'
import { HeaderCompact } from './HeaderCompact'
import { Memory } from './Memory'
import { Overview } from './Overview'
import { InformationDialog } from './Overview/Information/InformationDialog'
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
  const isInformationDialogOpen = useGameDetailStore((s) => s.isInformationDialogOpen)
  const setIsInformationDialogOpen = useGameDetailStore((s) => s.setIsInformationDialogOpen)
  const propertiesDialogState = useGameDetailStore((s) => s.propertiesDialog)
  const closePropertiesDialog = useGameDetailStore((s) => s.closePropertiesDialog)
  const openPropertiesDialog = useGameDetailStore((s) => s.openPropertiesDialog)
  const isPlayTimeEditorDialogOpen = useGameDetailStore((state) => state.isPlayTimeEditorDialogOpen)
  const setIsPlayTimeEditorDialogOpen = useGameDetailStore(
    (state) => state.setIsPlayTimeEditorDialogOpen
  )
  const isScoreEditorDialogOpen = useGameDetailStore((state) => state.isScoreEditorDialogOpen)
  const setIsScoreEditorDialogOpen = useGameDetailStore((state) => state.setIsScoreEditorDialogOpen)

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
    if (!isEditingLogo) return
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

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [imageViewerPath, setImageViewerPath] = useState<string | null>(null)

  async function openLargeBackground(): Promise<void> {
    try {
      const currentPath = await ipcManager.invoke('game:get-media-path', gameId, 'background')
      if (!currentPath) {
        toast.error(t('detail.properties.media.notifications.imageNotFound'))
        return
      }
      setImageViewerPath(currentPath)
      setIsImageViewerOpen(true)
    } catch (error) {
      toast.error(t('detail.properties.media.notifications.getImageError', { error }))
    }
  }

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
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={logoRef}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              style={{
                transform: `scale(${logoSize / 100})`,
                left: `${headerLayout === 'compact' && isInitialPosition(localLogoPosition) ? initialPositionInCompact.x : localLogoPosition.x}vw`,
                top: `${headerLayout === 'compact' && isInitialPosition(localLogoPosition) ? initialPositionInCompact.y : localLogoPosition.y}vh`,
                cursor: isEditingLogo ? (dragging ? 'grabbing' : 'grab') : 'default',
                transformOrigin: 'center center',
                zIndex: isEditingLogo ? 30 : 10
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
          </ContextMenuTrigger>
          <ContextMenuContent className={cn('w-40')}>
            <ContextMenuItem onSelect={() => openPropertiesDialog('media')}>
              {t('detail.contextMenu.editMediaProperties')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {/* Scrollable Content Area */}
      <ScrollArea
        ref={scrollAreaRef}
        className={cn('relative h-full w-full overflow-auto rounded-none')}
      >
        {/* Content Container with custom context menu */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'relative z-20 flex flex-col w-full min-h-[100vh]',
                headerLayout === 'compact' && 'p-4'
              )}
            >
              <div
                className={`mt-(--content-top-padding)`}
                onContextMenu={(e) => {
                  // Preserve native context menu inside this area
                  e.stopPropagation()
                }}
              >
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
                    <TabsList
                      className={cn('w-full justify-start bg-transparent')}
                      variant="underline"
                    >
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
              {/* Close content container div */}
            </div>
          </ContextMenuTrigger>

          {/* Custom context menu for the background area of content container */}
          <ContextMenuContent className={cn('w-40')}>
            <ContextMenuItem onSelect={() => openPropertiesDialog('media')}>
              修改媒体属性
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                void openLargeBackground()
              }}
            >
              {t('detail.properties.media.actions.viewLargeImage')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ScrollArea>

      {propertiesDialogState.open && (
        <GamePropertiesDialog
          gameId={gameId}
          isOpen={propertiesDialogState.open}
          setIsOpen={(open) => {
            if (!open) {
              closePropertiesDialog()
            }
          }}
          defaultTab={propertiesDialogState.defaultTab}
        />
      )}
      {isImageViewerOpen && (
        <ImageViewerDialog
          isOpen={isImageViewerOpen}
          imagePath={imageViewerPath}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}
      {isInformationDialogOpen && (
        <InformationDialog
          gameId={gameId}
          isOpen={isInformationDialogOpen}
          setIsOpen={setIsInformationDialogOpen}
        />
      )}
      {isPlayTimeEditorDialogOpen && (
        <PlayTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayTimeEditorDialogOpen} />
      )}
      {isScoreEditorDialogOpen && (
        <ScoreEditorDialog gameId={gameId} setIsOpen={setIsScoreEditorDialogOpen} />
      )}
    </div>
  )
}
