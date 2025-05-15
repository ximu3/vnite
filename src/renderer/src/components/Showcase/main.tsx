import { cn } from '~/utils'
import { ScrollArea } from '@ui/scroll-area'
import { Button } from '@ui/button'
import { RecentGames } from './RecentGames'
import { Collections } from './Collections'
import { AllGames } from './AllGames'
import { useGameRegistry } from '~/stores/game'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useTranslation } from 'react-i18next'
import { ScrollToTopButton } from './ScrollToTopButton'
import { useRef } from 'react'

export function Showcase(): JSX.Element {
  const { t } = useTranslation('game')
  const gameIds = useGameRegistry((state) => state.gameIds)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  console.warn('[DEBUG] Showcase')

  return (
    <div className={cn('flex flex-col gap-3 h-full bg-background/60')}>
      {gameIds.length !== 0 ? (
        <>
          <ScrollArea ref={scrollAreaRef} className={cn('w-full h-full')}>
            <div className={cn('pt-[50px] flex flex-col gap-3')}>
              <RecentGames />
              <Collections />
              <AllGames />
            </div>
          </ScrollArea>
          <ScrollToTopButton scrollAreaRef={scrollAreaRef} />
        </>
      ) : (
        <div className={cn('flex flex-col gap-1 items-center justify-center w-full h-full -mt-7')}>
          <div>
            <span className={cn('icon-[mdi--gamepad-variant] w-[60px] h-[60px]')}></span>
          </div>
          <div className={cn('text-2xl font-bold -mt-2')}>{t('showcase.welcome')}</div>
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
