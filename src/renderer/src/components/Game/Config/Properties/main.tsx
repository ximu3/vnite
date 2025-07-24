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
      <DialogContent className={cn('w-[70vw] h-[70vh] lg:h-[80vh] flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{`${gameName} - ${t('detail.properties.title')}`}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="launcher" className="flex-1 flex flex-col h-full">
          <TabsList className="">
            <TabsTrigger value="launcher">{t('detail.properties.tabs.launcher')}</TabsTrigger>
            <TabsTrigger value="path">{t('detail.properties.tabs.path')}</TabsTrigger>
            <TabsTrigger value="media">{t('detail.properties.tabs.media')}</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(95%-60px)]">
            <TabsContent value="launcher" className="pr-5 pb-3">
              <Launcher gameId={gameId} />
            </TabsContent>

            <TabsContent value="path" className="pr-5 pb-3">
              <Path gameId={gameId} />
            </TabsContent>

            <TabsContent value="media" className="pr-5 pb-3">
              <Media gameId={gameId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
