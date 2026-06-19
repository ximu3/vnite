import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageViewerDialog } from '~/components/dialog/ImageViewerDialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '~/components/ui/context-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { ScrollToTopButton } from '../Showcase/ScrollToTopButton'
import { ScrollArea } from '../ui/scroll-area'
import { PlayTimeEditorDialog } from './Config/ManageMenu/PlayTimeEditorDialog'
import { ScoreEditorDialog } from './Config/ManageMenu/ScoreEditorDialog'
import { GamePropertiesDialog } from './Config/Properties'
import { GameLogoOverlay } from './GameLogoOverlay'
import { Header } from './Header'
import { HeaderCompact } from './HeaderCompact'
import { Memory } from './Memory'
import { Overview } from './Overview'
import { InformationDialog } from './Overview/Information/InformationDialog'
import { CalculateStorageSizeDialog } from './Overview/Record/CalculateStorageSizeDialog'
import { Record } from './Record'
import { Save } from './Save'
import { useGameDetailStore, useGameDetailTabStore } from './store'
import { openLargeGameMediaImage } from './utils'

export function Game({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const headerRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [headerLayout] = useConfigState('appearances.gameDetail.headerLayout')

  const lastDetailTab = useGameDetailTabStore((s) => s.lastDetailTab)
  const setLastDetailTab = useGameDetailTabStore((s) => s.setLastDetailTab)
  const isInformationDialogOpen = useGameDetailStore((s) => s.isInformationDialogOpen)
  const setIsInformationDialogOpen = useGameDetailStore((s) => s.setIsInformationDialogOpen)
  const propertiesDialogState = useGameDetailStore((s) => s.propertiesDialog)
  const closePropertiesDialog = useGameDetailStore((s) => s.closePropertiesDialog)
  const openPropertiesDialog = useGameDetailStore((s) => s.openPropertiesDialog)
  const imageViewerDialogState = useGameDetailStore((s) => s.imageViewerDialog)
  const openImageViewerDialog = useGameDetailStore((s) => s.openImageViewerDialog)
  const closeImageViewerDialog = useGameDetailStore((s) => s.closeImageViewerDialog)
  const isPlayTimeEditorDialogOpen = useGameDetailStore((state) => state.isPlayTimeEditorDialogOpen)
  const setIsPlayTimeEditorDialogOpen = useGameDetailStore(
    (state) => state.setIsPlayTimeEditorDialogOpen
  )
  const isScoreEditorDialogOpen = useGameDetailStore((state) => state.isScoreEditorDialogOpen)
  const setIsScoreEditorDialogOpen = useGameDetailStore((state) => state.setIsScoreEditorDialogOpen)
  const isStorageSizeDialogOpen = useGameDetailStore((state) => state.isStorageSizeDialogOpen)
  const setIsStorageSizeDialogOpen = useGameDetailStore((state) => state.setIsStorageSizeDialogOpen)

  // Reset scroll position when gameId changes
  useEffect(() => {
    const viewportElement = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    if (!viewportElement) return
    viewportElement.scrollTop = 0
  }, [gameId])

  // Forward game detail scroll position to Light page effects.
  useEffect(() => {
    const viewportElement = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    if (!viewportElement) {
      console.error('ScrollArea viewport element not found')
      return
    }

    const handleScroll = (): void => {
      window.dispatchEvent(
        new CustomEvent('game-scroll', {
          detail: { scrollY: viewportElement.scrollTop }
        })
      )
    }

    viewportElement.addEventListener('scroll', handleScroll)
    // Add a class name so that Light components can find the scrollable element
    viewportElement.classList.add('scrollable-content')

    return (): void => {
      viewportElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className={cn('w-full h-full relative overflow-hidden shrink-0')}>
      <GameLogoOverlay gameId={gameId} scrollAreaRef={scrollAreaRef} />

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
                  <Tabs
                    value={lastDetailTab}
                    onValueChange={(value) => setLastDetailTab(value as typeof lastDetailTab)}
                    className={cn('w-full')}
                  >
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
              {t('detail.contextMenu.editMediaProperties')}
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                void openLargeGameMediaImage({ gameId, type: 'background', openImageViewerDialog })
              }}
            >
              {t('detail.properties.media.actions.viewLargeImage')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ScrollArea>
      <ScrollToTopButton scrollAreaRef={scrollAreaRef} threshold={500} />

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
      {imageViewerDialogState.open && (
        <ImageViewerDialog
          isOpen={imageViewerDialogState.open}
          imagePath={imageViewerDialogState.imagePath}
          onClose={closeImageViewerDialog}
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
      {isStorageSizeDialogOpen && (
        <CalculateStorageSizeDialog
          gameId={gameId}
          isOpen={isStorageSizeDialogOpen}
          setIsOpen={setIsStorageSizeDialogOpen}
        />
      )}
    </div>
  )
}
