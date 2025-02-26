import { useCallback } from 'react'
import { useGameCollectionStore } from '~/stores'
import type { gameCollectionDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export function useGameCollectionState<
  Path extends Paths<gameCollectionDoc, { bracketNotation: true }>
>(
  gameId: string,
  path: Path
): [Get<gameCollectionDoc, Path>, (value: Get<gameCollectionDoc, Path>) => Promise<void>] {
  // 获取值
  const value = useGameCollectionStore((state) => state.getGameCollectionValue(gameId, path))

  // 设置值
  const setValue = useCallback(
    (newValue: Get<gameCollectionDoc, Path>) => {
      return useGameCollectionStore.getState().setGameCollectionValue(gameId, path, newValue)
    },
    [gameId, path]
  )

  return [value, setValue]
}
