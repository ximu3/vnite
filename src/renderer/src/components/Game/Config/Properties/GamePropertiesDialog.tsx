import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/utils'
import { Launcher } from './Launcher'
import { Path } from './Path'
import { Media } from './Media'
import { useGameState } from '~/hooks'
import { useTranslation } from 'react-i18next'

export function GamePropertiesDialog({
  gameId,
  isOpen,
  setIsOpen
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [gameName] = useGameState(gameId, 'metadata.name')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={cn('w-[1000px] h-[85vh] flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{`${gameName} - ${t('detail.properties.title')}`}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="launcher" className="flex-1 flex flex-col h-full">
          <TabsList className="grid grid-cols-3 w-[350px]">
            <TabsTrigger value="launcher">{t('detail.properties.tabs.launcher')}</TabsTrigger>
            <TabsTrigger value="path">{t('detail.properties.tabs.path')}</TabsTrigger>
            <TabsTrigger value="media">{t('detail.properties.tabs.media')}</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100%-60px)] pr-5">
            <TabsContent value="launcher" className="">
              <Launcher gameId={gameId} />
            </TabsContent>

            <TabsContent value="path" className="">
              <Path gameId={gameId} />
            </TabsContent>

            <TabsContent value="media" className="">
              <Media gameId={gameId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
