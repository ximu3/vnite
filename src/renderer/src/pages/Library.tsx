import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { ipcOnUnique } from '~/utils'
import { useGameIndexManager } from '~/hooks'
import { Game } from '~/components/Game'
import { useEffect } from 'react'

export function Library(): JSX.Element {
  const { gameIndex } = useGameIndexManager()
  const [runningGames, setRunningGames] = useState<string[]>([])
  useEffect(() => {
    ipcOnUnique('game-exit', (_, gameId: string) => {
      setRunningGames((prev) => prev.filter((id) => id !== gameId))
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
          <Route path="/home/*" element={1} />
          {Array.from(gameIndex, ([key, game]) => (
            <Route
              key={key}
              path={`/${game.id}/*`}
              element={
                <Game
                  gameId={game.id || ''}
                  runningGames={runningGames}
                  setRunningGames={setRunningGames}
                />
              }
            />
          ))}
        </Routes>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
