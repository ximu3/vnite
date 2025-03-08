import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { cn } from '~/utils'
import { Launcher } from './Launcher'
import { Path } from './Path'
import { Media } from './Media'
import { useGameState } from '~/hooks'
import { useTranslation } from 'react-i18next'

export function AttributesDialog({
  gameId,
  setIsOpen
}: {
  gameId: string
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation('game')
  const [gameName] = useGameState(gameId, 'metadata.name')

  return (
    <Dialog open={true} onOpenChange={(state) => setIsOpen(state)}>
      <DialogContent className={cn('w-[1000px] max-h-[700px] h-[90vh] max-w-none flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{`${gameName} - ${t('detail.properties.title')}`}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="launcher" className={cn('w-full')}>
          <TabsList className={cn('w-[250px]')}>
            <TabsTrigger className={cn('w-1/3')} value="launcher">
              {t('detail.properties.tabs.launcher')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/3')} value="path">
              {t('detail.properties.tabs.path')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/3')} value="media">
              {t('detail.properties.tabs.media')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="launcher">
            <Launcher gameId={gameId} />
          </TabsContent>
          <TabsContent value="path">
            <Path gameId={gameId} />
          </TabsContent>
          <TabsContent value="media">
            <Media gameId={gameId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
