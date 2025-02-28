import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable'
import { toast } from 'sonner'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ipcOnUnique } from '~/utils'
import { useGameRegistry, useGameCollectionStore } from '~/stores/game'
import { Game } from '~/components/Game'
import { useEffect } from 'react'
import { useRunningGames } from './store'
import { Showcase } from '~/components/Showcase'
import { CollectionGames } from '~/components/Showcase/CollectionGames'
import { CollectionPage } from '~/components/Showcase/CollectionPage'

export function Library({ className }: { className?: string }): JSX.Element {
  const gameIds = useGameRegistry((state) => state.gameIds)
  const { documents: collections } = useGameCollectionStore()
  const { runningGames, setRunningGames } = useRunningGames()
  useEffect(() => {
    ipcOnUnique('game-exiting', (_, gameId: string) => {
      toast.loading('正在退出游戏...', { id: `${gameId}-exiting` })
    })
    ipcOnUnique('game-exited', (_, gameId: string) => {
      const newRunningGames = runningGames.filter((id) => id !== gameId)
      setRunningGames(newRunningGames)
      toast.success('游戏已退出', {
        id: `${gameId}-exiting`
      })
      setTimeout(() => {
        toast.dismiss(`${gameId}-exiting`)
      }, 4000)
    })
  }, [runningGames, setRunningGames])

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
