import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGameRegistry, useGameCollectionStore } from '~/stores/game'
import { Game } from '~/components/Game'
import { Showcase } from '~/components/Showcase'
import { CollectionGames } from '~/components/Showcase/CollectionGames'
import { CollectionPage } from '~/components/Showcase/CollectionPage'

export function Library({ className }: { className?: string }): JSX.Element {
  const gameIds = useGameRegistry((state) => state.gameIds)
  const collections = useGameCollectionStore((state) => state.documents)
  console.warn('[DEBUG] Library')
  return (
    <ResizablePanelGroup
      autoSaveId="LibraryPanelGroup"
      direction="horizontal"
      className={cn('w-full h-full', className)}
    >
      <ResizablePanel defaultSize={18} maxSize={26} minSize={13} collapsible={true}>
        <Librarybar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <Routes>
          <Route index element={<Navigate to="./home" replace />} />
          <Route path="/home/*" element={<Showcase />} />
          <Route path="/collections/*" element={<CollectionPage />} />
          {gameIds.length > 0 &&
            gameIds.map(
              (gameId) =>
                gameId && (
                  <Route
                    key={gameId}
                    path={`games/${gameId}/*`}
                    element={<Game gameId={gameId} />}
                  />
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
