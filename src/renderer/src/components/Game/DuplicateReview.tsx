import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@ui/button'
import { DialogTitle } from '@ui/dialog'
import { GameImage } from '@ui/game-image'
import { useGameRegistry } from '~/stores/game/gameRegistry'
import { getGameStore } from '~/stores/game/gameStoreFactory'

function DuplicateGameItem({ gameId }: { gameId: string }): React.JSX.Element | null {
  const { t } = useTranslation('adder')

  if (!useGameRegistry.getState().gameIds.includes(gameId)) return null
  const game = getGameStore(gameId).getState().data
  if (!game) return null

  const name = game.metadata?.name || game.metadata?.originalName || t('gameAdder.gameList.unknown')
  const ids = Object.entries(game.metadata || {}).filter(
    (entry): entry is [string, string] =>
      entry[0].endsWith('Id') && typeof entry[1] === 'string' && entry[1] !== ''
  )

  return (
    <li className="flex min-h-24 items-center gap-3 rounded-md border p-3">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        <GameImage
          gameId={gameId}
          type="cover"
          alt={name}
          className="h-full w-full object-cover"
          fallback={
            <span className="flex h-full items-center justify-center">
              <span className="icon-[mdi--gamepad-variant] size-6 text-muted-foreground" />
            </span>
          }
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-sm font-medium break-all whitespace-pre-wrap select-text">{name}</div>
        {ids.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground select-text">
            {ids.map(([key, value]) => (
              <span key={key} className="break-all whitespace-pre-wrap">
                {key.slice(0, -2)}: {value}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

export function DuplicateReview({
  gameIds,
  onConfirm
}: {
  gameIds: string[]
  onConfirm: () => void
}): React.JSX.Element {
  const { t } = useTranslation('adder')

  return (
    <div className="flex h-[80vh] w-[560px] flex-col gap-4 p-3">
      <div className="flex shrink-0 items-center gap-2 pr-6">
        <AlertTriangle className="size-5 shrink-0" />
        <DialogTitle className="text-base font-semibold">
          {t('gameAdder.duplicates.title')}
        </DialogTitle>
      </div>
      <ul className="scrollbar-base min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {gameIds.map((gameId) => (
          <DuplicateGameItem key={gameId} gameId={gameId} />
        ))}
      </ul>
      <div className="flex shrink-0 justify-end">
        <Button variant="outline" onClick={onConfirm}>
          {t('gameAdder.duplicates.continueAnyway')}
        </Button>
      </div>
    </div>
  )
}
