import { cn } from '~/utils'
import { useDBSyncedState } from '~/utils'
import { Button } from '@ui/button'
import { ScrollArea } from '@ui/scroll-area'

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
            {/* 空白区域，用于显示图片顶部30% */}
            <div className={cn('h-[45vh]')}></div>
            {/* 滚动内容区域，覆盖图片底部70% */}
            <div className={cn('relative bg-background min-h-[calc(100vh-64px)]')}>
              {/* 添加一个渐变过渡效果 */}
              <div
                className={cn(
                  'h-16 bg-gradient-to-b bg-background/80 absolute -top-16 left-0 right-0 flex-row flex justify-between items-center pl-5 pr-5'
                )}
              >
                <div className={cn('font-bold text-lg text-accent-foreground')}>Monkeys!¡</div>
                <div className={cn('flex flex-row gap-2 justify-center items-center')}>
                  <Button className={cn('')}>
                    <div className={cn('flex flex-row gap-1 justify-center items-center p-3')}>
                      <span className={cn('icon-[mdi--play] w-6 h-6 -ml-2')}></span>
                      <div className={cn('')}>开始游戏</div>
                    </div>
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
              <div className={cn('p-4')}></div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
