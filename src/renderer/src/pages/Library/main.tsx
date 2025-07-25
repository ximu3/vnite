import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { Separator } from '~/components/ui/separator'
import { Outlet } from '@tanstack/react-router'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { FloatingButtons } from '~/components/GameBatchEditor/FloatingButtons'

export function Library({ className }: { className?: string }): React.JSX.Element {
  console.warn('[DEBUG] Library')
  const isBatchMode = useGameBatchEditorStore((state) => state.isBatchMode)

  return (
    <div className={cn('flex flex-row w-full h-full relative', className)}>
      {/* 批量操作悬浮按钮组 */}
      {isBatchMode && <FloatingButtons />}
      <Librarybar />
      <Separator orientation="vertical" />
      <div className="flex-1 h-full relative shrink-0">
        <Outlet />
      </div>
    </div>
  )
}
