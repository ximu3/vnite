import { cn } from '~/utils'
import { useGameMedia } from '~/hooks'
import { ScrollArea } from '@ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { Header } from './Header'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const { mediaUrl: background } = useGameMedia({ gameId, type: 'background' })
  return (
    <div className={cn('w-full h-full')}>
      <div className={cn(background ? 'pt-[30px]' : 'pt-[30px] border-b-[1px]')}></div>

      <div className={cn('relative w-full h-screen overflow-hidden')}>
        {background && (
          <>
            <img src={background} className={cn('absolute top-0 left-0 w-full object-cover')} />
            <div className={cn('absolute top-0 left-0 w-full h-full', 'bg-background/15')} />
          </>
        )}
        <ScrollArea className={cn('w-full h-full absolute top-0 left-0')}>
          <div className={cn('relative h-full')}>
            <div className={cn(background ? 'h-[45vh]' : 'h-16')}></div>
            <div
              className={cn(
                background
                  ? 'relative bg-background h-[calc(100vh-64px)]'
                  : 'relative bg-background h-[calc(100vh-64px)]'
              )}
            >
              <Header gameId={gameId} className={cn('-top-16 left-0 right-0')} />
              {/* The content is placed here */}
              <div className={cn(background ? 'p-5' : 'p-5 border-t-[1px]')}>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className={cn('w-[250px]')}>
                    <TabsTrigger className={cn('w-1/3')} value="overview">
                      概览
                    </TabsTrigger>
                    <TabsTrigger className={cn('w-1/3')} value="record">
                      记录
                    </TabsTrigger>
                    <TabsTrigger className={cn('w-1/3')} value="save">
                      存档
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <Overview gameId={gameId} />
                  </TabsContent>
                  <TabsContent value="record">
                    <Record gameId={gameId} />
                  </TabsContent>
                  <TabsContent value="save">
                    <Save gameId={gameId} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
