import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ImperativePanelHandle
} from '@ui/resizable'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGameRegistry, useGameCollectionStore } from '~/stores/game'
import { Game } from '~/components/Game'
import { Showcase } from '~/components/Showcase'
import { CollectionGames } from '~/components/Showcase/CollectionGames'
import { CollectionPage } from '~/components/Showcase/CollectionPage'
import { GameProperties } from '~/components/Game/Config/Properties'
import { useState, useRef } from 'react'
import { useConfigState } from '~/hooks'

export function Library({ className }: { className?: string }): JSX.Element {
  const gameIds = useGameRegistry((state) => state.gameIds)
  const collections = useGameCollectionStore((state) => state.documents)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showCollapseButton] = useConfigState('game.gameList.showCollapseButton')
  const panelRef = useRef<ImperativePanelHandle>(null)
  console.warn('[DEBUG] Library')

  const toggleSidebar = (): void => {
    if (panelRef.current) {
      if (isCollapsed) {
        panelRef.current.expand()
      } else {
        panelRef.current.collapse()
      }
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <ResizablePanelGroup
      autoSaveId="LibraryPanelGroup"
      direction="horizontal"
      className={cn('w-full h-full shadow-inner', className)}
    >
      <ResizablePanel
        ref={panelRef}
        defaultSize={18}
        maxSize={26}
        minSize={13}
        collapsible={true}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
      >
        <Librarybar />
      </ResizablePanel>
      <ResizableHandle>
        {showCollapseButton && (
          <div
            className={cn(
              'flex items-center justify-center border rounded-lg cursor-pointer bg-border hover:bg-accent shadow-sm z-50',
              isCollapsed ? 'w-8 h-7 absolute right-[-10px] justify-end' : 'w-3 h-7'
            )}
            onClick={toggleSidebar}
          >
            <span
              className={cn(
                isCollapsed ? 'icon-[mdi--chevron-right]' : 'icon-[mdi--chevron-left]',
                'w-2.5 h-2.5'
              )}
            ></span>
          </div>
        )}
      </ResizableHandle>
      <ResizablePanel>
        <Routes>
          <Route index element={<Navigate to="./home" replace />} />
          <Route path="/home/*" element={<Showcase />} />
          <Route path="/collections/*" element={<CollectionPage />} />
          {gameIds.length > 0 &&
            gameIds.map(
              (gameId) =>
                gameId && (
                  <>
                    <Route
                      key={gameId}
                      path={`games/${gameId}/:groupId`}
                      element={<Game gameId={gameId} />}
                    />
                    <Route
                      key={`${gameId}-attributes`}
                      path={`games/${gameId}/:groupId/properties`}
                      element={<GameProperties gameId={gameId} />}
                    />
                  </>
                )
            )}
          {gameIds.length > 0 &&
            Object.values(collections)?.map((collection) => (
              <Route
                key={collection._id}
                path={`collections/${collection._id}/*`}
                element={<CollectionGames collectionId={collection._id} />}
              />
            ))}
        </Routes>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
