import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { Separator } from '~/components/ui/separator'
import { Outlet } from '@tanstack/react-router'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { FloatingButtons } from '~/components/GameBatchEditor/FloatingButtons'
import { useGameRegistry } from '~/stores/game'
import { useEffect } from 'react'

export function Library({ className }: { className?: string }): React.JSX.Element {
  console.warn('[DEBUG] Library')
  const isBatchMode = useGameBatchEditorStore((state) => state.isBatchMode)
  const selectGames = useGameBatchEditorStore((state) => state.selectGames)
  const gameIds = useGameRegistry((state) => state.gameIds)

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl + A 选择所有游戏
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault() // 阻止默认行为
        selectGames(gameIds)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectGames, gameIds])

  return (
    <div className={cn('flex flex-row w-full h-full relative', className)}>
      {/* 批量操作悬浮按钮组 */}
      {isBatchMode && <FloatingButtons />}
      <Librarybar />
      <Separator orientation="vertical" />
      <div className="flex-1 h-full relative">
        <Outlet />
      </div>
    </div>
  )
}
