import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable'
import { Button } from '@ui/button'
import { Routes, Route, Navigate } from 'react-router-dom'

export function Library(): JSX.Element {
  return (
    <ResizablePanelGroup direction="horizontal" className={cn('w-full h-full')}>
      <ResizablePanel defaultSize={18} maxSize={30} minSize={12}>
        <Librarybar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <Routes>
          <Route index element={<Navigate to="./home" />} />
          <Route
            path="/home/*"
            element={
              <div className="pt-[23px]">
                <div className="flex flex-row font-bold justify-between items-center">
                  <div className="flex flex-row gap-3 font-bold p-3">
                    <div className="flex justify-center items-end">景之海的艾佩莉娅</div>
                    <div className="text-xs flex justify-center items-end pb-[1px]">
                      景の海のアペイリア
                    </div>
                  </div>
                  <div className="flex flex-row gap-3 justify-center items-center p-3">
                    <Button variant="ghost" size={'icon'} className="non-draggable w-7 h-7">
                      <span className={cn('icon-[mdi--play-outline] w-5 h-5')}></span>
                    </Button>
                  </div>
                </div>
                <div className="">
                  <div className="border-t-[1px] border-border">
                    {/* <img src="https://img.timero.xyz/i/2024/06/09/6665a4fadb8c0.webp"></img> */}
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
