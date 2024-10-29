import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Button } from '@ui/button'
import { ScrollArea } from '@ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Badge } from '@ui/badge'
import { Overview } from './Overview'
import { Record } from './Record'
import { Config } from './Config'
import { StartGame } from './StartGame'

type JsonObject = { [key: string]: JsonObject | any }

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const [gameData] = useDBSyncedState<JsonObject>({}, `games/${gameId}/metadata.json`, ['#all'])
  return (
    <div className={cn('w-full h-full')}>
      <div className={cn('pt-[30px]')}></div>

      <div className={cn('relative w-full h-screen overflow-hidden')}>
        <img
          src="https://img.timero.xyz/i/2024/10/20/67150a8c70c36.webp"
          className={cn('absolute top-0 left-0 w-full object-cover')}
        />
        <ScrollArea className={cn('w-full h-full absolute top-0 left-0')}>
          <div className={cn('relative h-full')}>
            <div className={cn('h-[45vh]')}></div>
            <div className={cn('relative bg-background h-[calc(100vh-64px)]')}>
              <div
                className={cn(
                  'h-16 bg-gradient-to-b bg-background/80 absolute -top-16 left-0 right-0 flex-row flex justify-between items-center pl-7 pr-7'
                )}
              >
                <div className={cn('flex flex-row gap-5 items-center justify-center')}>
                  <div className={cn('font-bold text-xl text-accent-foreground')}>
                    {gameData.name}
                  </div>
                  <div className={cn('flex flex-row gap-2 items-center justify-center')}>
                    <Badge variant="secondary">已安装</Badge>
                  </div>
                </div>
                <div className={cn('flex flex-row gap-3 justify-center items-center', '3xl:gap-5')}>
                  <StartGame gameId={gameId} />
                  <Button variant="outline" size={'icon'} className="non-draggable">
                    <span className={cn('icon-[mdi--starburst-edit-outline] w-4 h-4')}></span>
                  </Button>
                  <Button variant="outline" size={'icon'} className="non-draggable">
                    <span className={cn('icon-[mdi--bookmark-outline] w-4 h-4')}></span>
                  </Button>
                  <Config gameId={gameId} />
                </div>
              </div>
              {/* 内容放在这里 */}
              <div className={cn('p-5')}>
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
                </Tabs>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
