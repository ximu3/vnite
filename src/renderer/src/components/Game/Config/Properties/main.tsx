import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { ScrollArea } from '@ui/scroll-area'
import { cn } from '~/utils'
import { Launcher } from './Launcher'
import { Path } from './Path'
import { Media } from './Media'
import { useGameState } from '~/hooks'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/button'
import { useNavigate } from 'react-router-dom'

export function GameProperties({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const { t } = useTranslation('game')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const navigate = useNavigate()

  const handleGoBack = (): void => {
    navigate(-1)
  }

  return (
    <div className={cn('w-full h-full bg-background/60 pt-[50px]', className)}>
      <ScrollArea className={cn('w-full h-full px-6 pt-0')}>
        <div className={cn('flex flex-col gap-6')}>
          <div className={cn('flex flex-row items-end gap-5')}>
            <div className={cn('text-2xl font-bold')}>
              {`${gameName} - ${t('detail.properties.title')}`}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleGoBack}
              className="w-[26px] h-[26px]"
              aria-label={t('common.back')}
            >
              <span className="icon-[mdi--close] w-4 h-4"></span>
            </Button>
          </div>

          <Tabs defaultValue="launcher" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 w-[350px]">
              <TabsTrigger value="launcher">{t('detail.properties.tabs.launcher')}</TabsTrigger>
              <TabsTrigger value="path">{t('detail.properties.tabs.path')}</TabsTrigger>
              <TabsTrigger value="media">{t('detail.properties.tabs.media')}</TabsTrigger>
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
        </div>
      </ScrollArea>
    </div>
  )
}
