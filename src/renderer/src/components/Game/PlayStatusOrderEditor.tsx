import type { gameDoc } from '@appTypes/models'
import { Button } from '@ui/button'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'

interface PlayStatusOrderEditorProps {
  order: readonly gameDoc['record']['playStatus'][]
  onOrderChange: (order: gameDoc['record']['playStatus'][]) => void
}

export function PlayStatusOrderEditor({
  order,
  onOrderChange
}: PlayStatusOrderEditorProps): React.JSX.Element {
  const { t } = useTranslation('game')

  const moveStatus = (index: number, offset: -1 | 1): void => {
    const targetIndex = index + offset
    if (targetIndex < 0 || targetIndex >= order.length) return

    const newOrder = [...order]
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    onOrderChange(newOrder)
  }

  return (
    <div className="flex flex-col gap-3">
      {order.map((status, index) => (
        <div
          key={status}
          className={cn('flex flex-row gap-3 items-center justify-between', 'ml-5 mr-5')}
        >
          <div className={cn('text-sm whitespace-nowrap')}>
            {t(`utils:game.playStatus.${status}`)}
          </div>
          <div className="flex flex-row gap-1">
            <Button
              variant="outline"
              size="icon"
              className={cn('h-[26px] w-[26px] ml-1')}
              disabled={index === 0}
              onClick={() => moveStatus(index, -1)}
            >
              <span className={cn('icon-[mdi--keyboard-arrow-up] w-4 h-4')}></span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn('h-[26px] w-[26px] ml-1')}
              disabled={index === order.length - 1}
              onClick={() => moveStatus(index, 1)}
            >
              <span className={cn('icon-[mdi--keyboard-arrow-down] w-4 h-4')}></span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
