import { useCallback, useEffect, useState, useRef } from 'react'
import { useGameCollectionStore } from '~/stores'
import type { gameCollectionDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useGameCollectionState<
  Path extends Paths<gameCollectionDoc, { bracketNotation: true }>
>(
  gameId: string,
  path: Path
): [Get<gameCollectionDoc, Path>, (value: Get<gameCollectionDoc, Path>) => Promise<void>] {
  const initialValue = useGameCollectionStore.getState().getGameCollectionValue(gameId, path)

  // 使用本地状态存储当前值
  const [localValue, setLocalValue] = useState<Get<gameCollectionDoc, Path>>(initialValue)

  // 使用 ref 存储最新的本地值
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // 订阅 store 的更改
  useEffect(() => {
    // 获取初始值，确保与 store 同步
    const currentValue = useGameCollectionStore.getState().getGameCollectionValue(gameId, path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    // 订阅 store 的更改
    const unsubscribe = useGameCollectionStore.subscribe((state) => {
      const newValue = state.getGameCollectionValue(gameId, path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [gameId, path]) // 移除 localValue 依赖，避免不必要的重新订阅

  // 更新函数
  const setValue = useCallback(
    async (newValue: Get<gameCollectionDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      // 先更新本地状态以立即响应
      setLocalValue(newValue)

      // 然后更新 store
      return useGameCollectionStore.getState().setGameCollectionValue(gameId, path, newValue)
    },
    [gameId, path, localValue]
  )

  return [localValue, setValue]
}
