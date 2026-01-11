import { Outlet } from '@tanstack/react-router'
import { Toaster } from '@ui/sonner'
import { Sidebar } from '~/components/Sidebar'
import { ThemeProvider } from '~/components/ThemeProvider'
import { Titlebar } from '~/components/Titlebar'
import { DragContainer } from '~/pages/DragContainer'
import { GameAdder } from '~/pages/GameAdder'
import { GameBatchAdder } from '~/pages/GameBatchAdder'
import { GameMetadataUpdaterDialog } from '~/pages/GameMetadataUpdater'
import { Importer } from '~/pages/Importer'
import { Light } from '~/pages/Light'
import { LogDialog } from '~/pages/Log'
import { UpdateDialog } from '~/pages/Updater'
import { Setup } from '~/Setup'
import { useBackupStore } from '~/stores/utils'

export function RootLayout(): React.JSX.Element {
  console.warn('[DEBUG] RootLayout')
  const isBackingUp = useBackupStore((state) => state.isBackingUp)

  return (
    <ThemeProvider>
      <div className="w-screen h-screen overflow-hidden">
        <DragContainer>
          <Setup />
          <Light />
          <div className="flex flex-row w-full h-full overflow-hidden">
            <Sidebar />
            <div className="flex flex-col w-full h-full overflow-hidden">
              <Titlebar />
              <div className="flex-1 overflow-hidden w-full">
                <Outlet />
              </div>
            </div>
          </div>
        </DragContainer>
        {isBackingUp && (
          <div className="fixed inset-0 bg-black/80 z-[999] pointer-events-auto"></div>
        )}
      </div>
      <GameAdder />
      <GameBatchAdder />
      <Toaster />
      <UpdateDialog />
      <Importer />
      <GameMetadataUpdaterDialog />
      <LogDialog />
    </ThemeProvider>
  )
}
