import { useCallback } from 'react'
import { useGameStore } from '~/stores'
import type { gameDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export function useGameState<Path extends Paths<gameDoc, { bracketNotation: true }>>(
  gameId: string,
  path: Path
): [Get<gameDoc, Path>, (value: Get<gameDoc, Path>) => Promise<void>] {
  // 获取值
  const value = useGameStore((state) => state.getGameValue(gameId, path))

  // 设置值
  const setValue = useCallback(
    (newValue: Get<gameDoc, Path>) => {
      return useGameStore.getState().setGameValue(gameId, path, newValue)
    },
    [gameId, path]
  )

  return [value, setValue]
}
