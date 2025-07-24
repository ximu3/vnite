import { cn } from '~/utils'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Button } from '~/components/ui/button'
import { RecentGames } from './RecentGames'
import { Collections } from './Collections'
import { AllGames } from './AllGames'
import { useGameRegistry } from '~/stores/game'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useTranslation } from 'react-i18next'
import { ScrollToTopButton } from './ScrollToTopButton'
import { useRef, useEffect } from 'react'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'

export function Showcase(): React.JSX.Element {
  const { t } = useTranslation('game')
  const gameIds = useGameRegistry((state) => state.gameIds)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const selectGames = useGameBatchEditorStore((state) => state.selectGames)

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // 检查当前是否有对话框元素处于活动状态
      const isDialogActive =
        document.querySelector('dialog[open]') !== null ||
        document.querySelector('.modal.active') !== null ||
        document.querySelector('[role="dialog"]') !== null

      // 当对话框打开时，不执行快捷键功能
      if (isDialogActive) {
        return
      }

      // Ctrl + A 选择所有游戏
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        selectGames(gameIds)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectGames, gameIds])

  return (
    <div className={cn('flex flex-col gap-3 h-full w-full bg-transparent')}>
      {gameIds.length !== 0 ? (
        <>
          <ScrollArea ref={scrollAreaRef} className={cn('w-full h-full')}>
            <div className={cn('pt-[18px] flex flex-col gap-3')}>
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
