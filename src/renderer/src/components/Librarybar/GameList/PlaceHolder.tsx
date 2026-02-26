import { cn } from '~/utils'

export function PlaceHolder({
  gameId,
  groupId
}: {
  gameId: string
  groupId: string
}): React.JSX.Element {
  return (
    <div
      className={cn('p-3 h-5 rounded-none bg-transparent')}
      data-game-id={gameId}
      data-group-id={groupId}
    ></div>
  )
}
