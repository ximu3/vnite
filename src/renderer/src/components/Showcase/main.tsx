import { cn } from '~/utils'
import { ScrollArea } from '@ui/scroll-area'
import { Button } from '@ui/button'
import { RecentGames } from './RecentGames'
import { Collections } from './Collections'
import { AllGames } from './AllGames'
import { useGameRegistry } from '~/stores/game'
import { useGameAdderStore } from '~/pages/GameAdder/store'

export function Showcase(): JSX.Element {
  const gameIds = useGameRegistry((state) => state.gameIds)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  console.warn('[DEBUG] Showcase')
  return (
    <div className={cn('flex flex-col gap-3 h-[100vh] pt-[30px]')}>
      {gameIds.length !== 0 ? (
        <ScrollArea className={cn('w-full')}>
          <RecentGames />
          <Collections />
          <AllGames />
        </ScrollArea>
      ) : (
        <div className={cn('flex flex-col gap-1 items-center justify-center w-full h-full -mt-7')}>
          <div>
            <span className={cn('icon-[mdi--gamepad-variant] w-[60px] h-[60px]')}></span>
          </div>
          <div className={cn('text-2xl font-bold -mt-2')}>
            欢迎使用Vnite，请添加你的第一个游戏。
          </div>
          <Button
            variant={'outline'}
            className={cn('mt-4')}
            onClick={() => {
              setIsOpen(true)
            }}
            size={'icon'}
          >
            <span className={cn('icon-[mdi--plus] w-5 h-5')}></span>
          </Button>
        </div>
      )}
    </div>
  )
}
