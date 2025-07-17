import { Outlet } from '@tanstack/react-router'
import { Toaster } from '@ui/sonner'
import { Titlebar } from '../components/Titlebar'
import { ThemeProvider } from '../components/ThemeProvider'
import { Sidebar } from '../components/Sidebar'
import { GameAdder } from '../pages/GameAdder'
import { GameBatchAdder } from '../pages/GameBatchAdder'
import { UpdateDialog } from '../pages/Updater'
import { Importer } from '../pages/Importer'
import { Setup } from '../Setup'
import { Light } from '../pages/Light'
import { DragContainer } from '../pages/DragContainer'

export function RootLayout(): React.JSX.Element {
  console.warn('[DEBUG] RootLayout')
  return (
    <ThemeProvider>
      <div className="w-screen h-screen">
        <DragContainer>
          <Setup />
          <Light />
          <div className="flex flex-row w-full h-full">
            <Sidebar />
            <div className="flex flex-col w-full h-full">
              <Titlebar />
              <div className="flex-1 overflow-hidden w-full">
                <Outlet />
              </div>
            </div>
          </div>
        </DragContainer>
      </div>
      <GameAdder />
      <GameBatchAdder />
      <Toaster />
      <UpdateDialog />
      <Importer />
    </ThemeProvider>
  )
}
