import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ipcOnUnique } from '~/utils'
import { useGameIndexManager, useCollections } from '~/hooks'
import { Game } from '~/components/Game'
import { useEffect } from 'react'
import { useRunningGames } from './store'
import { Showcase } from '~/components/Showcase'
import { CollectionGames } from '~/components/Showcase/CollectionGames'
import { CollectionPage } from '~/components/Showcase/CollectionPage'

export function Library({ className }: { className?: string }): JSX.Element {
  const { gameIndex } = useGameIndexManager()
  const { collections } = useCollections()
  const { runningGames, setRunningGames } = useRunningGames()
  useEffect(() => {
    ipcOnUnique('game-exit', (_, gameId: string) => {
      const newRunningGames = runningGames.filter((id) => id !== gameId)
      setRunningGames(newRunningGames)
    })
  }, [runningGames, setRunningGames])
  return (
    <ResizablePanelGroup
      autoSaveId="LibraryPanelGroup"
      direction="horizontal"
      className={cn('w-full h-full', className)}
    >
      <ResizablePanel defaultSize={18} maxSize={26} minSize={0} className={cn('')}>
        <Librarybar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <Routes>
          <Route index element={<Navigate to="./home" replace />} />
          <Route path="/home/*" element={<Showcase />} />
          <Route path="/collections/*" element={<CollectionPage />} />
          {gameIndex &&
            Object.values(gameIndex)?.map(
              (game) =>
                game.id && (
                  <Route
                    key={game.id}
                    path={`games/${game.id}/*`}
                    element={<Game gameId={game.id} />}
                  />
                )
            )}
          {gameIndex &&
            Object.values(collections)?.map((collection) => (
              <Route
                key={collection.id}
                path={`collections/${collection.id}/*`}
                element={<CollectionGames collectionId={collection.id} />}
              />
            ))}
        </Routes>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
