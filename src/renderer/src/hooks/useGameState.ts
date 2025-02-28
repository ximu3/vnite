import { useCallback, useEffect, useState, useRef } from 'react'
import { getGameStore } from '~/stores/game/gameStoreFactory'
import type { gameDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useGameState<Path extends Paths<gameDoc, { bracketNotation: true }>>(
  gameId: string,
  path: Path
): [Get<gameDoc, Path>, (value: Get<gameDoc, Path>) => Promise<void>] {
  const gameStore = getGameStore(gameId)
  const initialValue = gameStore.getState().getValue(path)

  // 使用本地状态存储当前值
  const [localValue, setLocalValue] = useState<Get<gameDoc, Path>>(initialValue)

  // 使用 ref 存储最新的本地值
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // 订阅 store 的更改
  useEffect(() => {
    // 获取初始值，确保与 store 同步
    const currentValue = gameStore.getState().getValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    // 方法 1: 单一监听器模式 (适用于所有版本的 Zustand)
    const unsubscribe = gameStore.subscribe((state) => {
      const newValue = state.getValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [gameId, path]) // 移除 localValue 依赖，避免不必要的重新订阅

  // 更新函数
  const setValue = useCallback(
    async (newValue: Get<gameDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      // 先更新本地状态以立即响应
      setLocalValue(newValue)

      // 然后更新 store
      return gameStore.getState().setValue(path, newValue)
    },
    [gameId, path, localValue]
  )

  return [localValue, setValue]
}
