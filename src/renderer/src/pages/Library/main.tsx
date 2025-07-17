import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { Separator } from '~/components/ui/separator'
import { Outlet } from '@tanstack/react-router'

export function Library({ className }: { className?: string }): React.JSX.Element {
  console.warn('[DEBUG] Library')

  return (
    <div className={cn('flex flex-row w-full h-full', className)}>
      <Librarybar />
      <Separator orientation="vertical" />
      <div className="flex-1 h-full relative">
        <Outlet />
      </div>
    </div>
  )
}
