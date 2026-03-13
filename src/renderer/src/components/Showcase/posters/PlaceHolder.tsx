import { cn } from '~/utils'

export function PlaceHolder(): React.JSX.Element {
  return (
    <div className={cn('w-[148px] h-[222px] cursor-pointer object-cover', 'bg-transparent')}></div>
  )
}
