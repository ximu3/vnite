import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Button } from '@ui/button'
import { ScrollArea } from '@ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Badge } from '@ui/badge'
import { RecordCard } from './RecordCard'
import { Introduction } from './Introduction'
import { Information } from './Information'
import { RelatedSites } from './RelatedSites'
import { Tags } from './Tags'

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
                  <Button className={cn('')}>
                    <div className={cn('flex flex-row gap-1 justify-center items-center p-3')}>
                      <span className={cn('icon-[mdi--play] w-6 h-6 -ml-2')}></span>
                      <div className={cn('')}>开始游戏</div>
                    </div>
                  </Button>
                  <Button variant="outline" size={'icon'} className="non-draggable">
                    <span className={cn('icon-[mdi--starburst-edit-outline] w-4 h-4')}></span>
                  </Button>
                  <Button variant="outline" size={'icon'} className="non-draggable">
                    <span className={cn('icon-[mdi--bookmark-outline] w-4 h-4')}></span>
                  </Button>
                  <Button variant="outline" size={'icon'} className="non-draggable">
                    <span className={cn('icon-[mdi--settings-outline] w-4 h-4')}></span>
                  </Button>
                </div>
              </div>
              {/* 内容放在这里 */}
              <div className={cn('p-5')}>
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className={cn('w-[250px]')}>
                    <TabsTrigger className={cn('w-1/3')} value="account">
                      概览
                    </TabsTrigger>
                    <TabsTrigger className={cn('w-1/3')} value="password">
                      记录
                    </TabsTrigger>
                    <TabsTrigger className={cn('w-1/3')} value="save">
                      存档
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">
                    <div className={cn('w-full h-full flex flex-col gap-5 pt-2', '3xl:gap-7')}>
                      <div className={cn('flex flex-row gap-5', '3xl:gap-7')}>
                        <RecordCard
                          title="游玩时间"
                          content="19.3 h"
                          icon="icon-[mdi--timer-outline] w-[20px] h-[20px]"
                          className={cn('w-1/4')}
                        />
                        <RecordCard
                          title="最后运行日期"
                          content="2024-10-20"
                          icon="icon-[mdi--calendar-blank-multiple] w-[18px] h-[18px]"
                          className={cn('w-1/4')}
                        />
                        <RecordCard
                          title="状态"
                          content="游玩中"
                          icon="icon-[mdi--bookmark-outline] w-[20px] h-[20px]"
                          className={cn('w-1/4')}
                        />
                        <RecordCard
                          title="我的评分"
                          content="8.5 分"
                          icon="icon-[mdi--starburst-outline] w-[18px] h-[18px]"
                          className={cn('w-1/4')}
                        />
                      </div>
                      <div
                        className={cn('flex flex-row gap-5 items-start justify-start', '3xl:gap-7')}
                      >
                        <div
                          className={cn(
                            'w-[calc(75%-4px)] flex flex-col gap-5',
                            '3xl:w-[calc(75%-6px)] 3xl:gap-7'
                          )}
                        >
                          <Introduction gameId={gameId} />
                          <Tags gameId={gameId} />
                        </div>
                        <div className={cn('flex flex-col gap-5 grow', '3xl:gap-7')}>
                          <Information gameId={gameId} />
                          <RelatedSites gameId={gameId} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="password">Change your password here.</TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
