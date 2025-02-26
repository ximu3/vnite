import { useCallback } from 'react'
import { useGameLocalStore } from '~/stores'
import type { gameLocalDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export function useGameLocalState<Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
  gameId: string,
  path: Path
): [Get<gameLocalDoc, Path>, (value: Get<gameLocalDoc, Path>) => Promise<void>] {
  // 获取值
  const value = useGameLocalStore((state) => state.getGameLocalValue(gameId, path))

  // 设置值
  const setValue = useCallback(
    (newValue: Get<gameLocalDoc, Path>) => {
      return useGameLocalStore.getState().setGameLocalValue(gameId, path, newValue)
    },
    [gameId, path]
  )

  return [value, setValue]
}
