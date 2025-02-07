import { cn } from '~/utils'
import { InfiniteProgress } from '@ui/infinite-progress'

export function Splash(): JSX.Element {
  return (
    <div className={cn('h-screen w-screen flex items-center justify-center bg-transparent')}>
      <div
        className={cn(
          'flex flex-col items-center justify-center w-full h-full bg-gradient-to-r from-primary to-accent rounded-lg'
        )}
      >
        <div className={cn('text-7xl font-mono mb-4 select-none')}>VNITE</div>
        <div className="w-48">
          <InfiniteProgress />
        </div>
      </div>
    </div>
  )
}
