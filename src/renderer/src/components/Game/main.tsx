import { cn } from '~/utils'
import { useGameMedia } from '~/hooks'
import { ScrollArea } from '@ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Overview } from './Overview'
import { Record } from './Record'
import { Header } from './Header'

export function Game({
  gameId,
  runningGames,
  setRunningGames
}: {
  gameId: string
  runningGames: string[]
  setRunningGames: (value: string[]) => void
}): JSX.Element {
  const { mediaUrl: background } = useGameMedia({ gameId, type: 'background' })
  return (
    <div className={cn('w-full h-full')}>
      <div className={cn(background ? 'pt-[30px]' : 'pt-[30px] border-b-[1px]')}></div>

      <div className={cn('relative w-full h-screen overflow-hidden')}>
        {background && (
          <img src={background} className={cn('absolute top-0 left-0 w-full object-cover')} />
        )}
        <ScrollArea className={cn('w-full h-full absolute top-0 left-0')}>
          <div className={cn('relative h-full')}>
            <div className={cn(background ? 'h-[45vh]' : 'h-16')}></div>
            <div
              className={cn(
                background
                  ? 'relative bg-background h-[calc(100vh-64px)]'
                  : 'relative bg-background h-[calc(100-64pxvh)]'
              )}
            >
              <Header
                gameId={gameId}
                runningGames={runningGames}
                setRunningGames={setRunningGames}
                className={cn('-top-16 left-0 right-0')}
              />
              {/* 内容放在这里 */}
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
                </Tabs>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
