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

export function Library(): JSX.Element {
  const { gameIndex } = useGameIndexManager()
  const { collections } = useCollections()
  const { runningGames, setRunningGames } = useRunningGames()
  useEffect(() => {
    ipcOnUnique('game-exit', (_, gameId: string) => {
      const newRunningGames = runningGames.filter((id) => id !== gameId)
      setRunningGames(newRunningGames)
    })
  }, [])
  return (
    <ResizablePanelGroup direction="horizontal" className={cn('w-full h-full')}>
      <ResizablePanel defaultSize={18} maxSize={30} minSize={12}>
        <Librarybar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <Routes>
          <Route index element={<Navigate to="./home" />} />
          <Route path="/home/*" element={<Showcase />} />
          <Route path="/collections/*" element={<CollectionPage />} />
          {Array.from(gameIndex, ([key, game]) => (
            <Route
              key={key}
              path={`games/${game.id}/*`}
              element={<Game gameId={game.id || ''} />}
            />
          ))}
          {Object.values(collections).map((collection) => (
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
