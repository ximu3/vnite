import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { PropertiesDialogTab } from '../../store'
import { Launcher, LauncherHandle } from './Launcher'
import { Media } from './Media'
import { Path, PathHandle } from './Path'

export function GamePropertiesDialog({
  gameId,
  isOpen,
  setIsOpen,
  defaultTab
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  defaultTab?: PropertiesDialogTab
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [activeTab, setActiveTab] = useState<PropertiesDialogTab>(defaultTab ?? 'launcher')

  const pathRef = useRef<PathHandle>(null)
  const launcherRef = useRef<LauncherHandle>(null)
  async function handleTabChange(newTab: string): Promise<void> {
    // When directly change tab after edit input, the change may not be saved
    if (activeTab === 'path') {
      await pathRef.current?.save()
    } else if (activeTab === 'launcher') {
      await launcherRef.current?.save()
    }
    setActiveTab(newTab as PropertiesDialogTab)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={cn('w-[70vw] h-[70vh] lg:h-[80vh] flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{`${gameName} - ${t('detail.properties.title')}`}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex-1 flex flex-col h-full"
        >
          <TabsList className="">
            <TabsTrigger value="launcher">{t('detail.properties.tabs.launcher')}</TabsTrigger>
            <TabsTrigger value="path">{t('detail.properties.tabs.path')}</TabsTrigger>
            <TabsTrigger value="media">{t('detail.properties.tabs.media')}</TabsTrigger>
          </TabsList>

          {/* -ml-1 and pl-1 to show the left shadow */}
          <ScrollArea className="h-[calc(95%-60px)] -ml-1">
            <TabsContent value="launcher" className="pr-5 pb-3 pl-1">
              <Launcher gameId={gameId} ref={launcherRef} />
            </TabsContent>

            <TabsContent value="path" className="pr-5 pb-3 pl-1">
              <Path gameId={gameId} ref={pathRef} />
            </TabsContent>

            <TabsContent value="media" className="pr-5 pb-3 pl-1">
              <Media gameId={gameId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
