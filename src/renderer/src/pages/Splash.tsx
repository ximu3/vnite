import { cn } from '~/utils'
import { InfiniteProgress } from '@ui/infinite-progress'

export function Splash(): React.JSX.Element {
  return (
    <div
      className={cn(
        'h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-r from-primary to-accent rounded-lg'
      )}
    >
      <div className={cn('text-7xl font-mono mb-4 select-none')}>VNITE</div>
      <div className="w-48">
        <InfiniteProgress />
      </div>
    </div>
  )
}
