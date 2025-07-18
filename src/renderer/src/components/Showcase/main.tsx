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
import { FloatingButtons } from '~/components/GameBatchEditor/FloatingButtons'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { useRef, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

export function Showcase(): React.JSX.Element {
  const { t } = useTranslation('game')
  const gameIds = useGameRegistry((state) => state.gameIds)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // 批量操作相关状态
  const { isBatchMode, clearSelection } = useGameBatchEditorStore()

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Escape键退出批量模式
      if (e.key === 'Escape' && isBatchMode) {
        clearSelection()
      }

      // Ctrl+A 全选（可以在AllGames组件中实现）
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBatchMode, clearSelection])

  // 当路由变化时，如果不在游戏详情页面并且不在批量模式下，清除选择
  useEffect(() => {
    if (!location.pathname.includes(`/library/home/`) && !isBatchMode) {
      // clearSelection()
    }
  }, [location.pathname, isBatchMode, clearSelection])

  return (
    <div className={cn('flex flex-col gap-3 h-full w-full bg-transparent')}>
      {/* 批量操作悬浮按钮组 */}
      {isBatchMode && <FloatingButtons />}

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
