import { cn } from '~/utils'
import { SHOWCASE_POSTER_CARD_WIDTH, SHOWCASE_POSTER_ITEM_OUTER_HEIGHT } from '../posterGridMetrics'

export function PlaceHolder(): React.JSX.Element {
  return (
    <div
      className={cn('cursor-pointer object-cover bg-transparent')}
      style={{
        width: SHOWCASE_POSTER_CARD_WIDTH,
        height: SHOWCASE_POSTER_ITEM_OUTER_HEIGHT
      }}
    ></div>
  )
}
