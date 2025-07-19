import { useCallback, useEffect, useState, useRef } from 'react'
import { getGameLocalStore } from '~/stores/game/gameLocalStoreFactory'
import type { gameLocalDoc } from '@appTypes/models'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useGameLocalState<
  Path extends Paths<gameLocalDoc, { bracketNotation: true }>,
  SaveMode extends boolean = false
>(
  gameId: string,
  path: Path,
  saveMode: SaveMode = false as SaveMode
): SaveMode extends true
  ? [
      Get<gameLocalDoc, Path>,
      (value: Get<gameLocalDoc, Path>) => void,
      () => Promise<void>,
      (value: Get<gameLocalDoc, Path>) => Promise<void>
    ]
  : [Get<gameLocalDoc, Path>, (value: Get<gameLocalDoc, Path>) => Promise<void>] {
  const gameLocalStore = getGameLocalStore(gameId)
  const initialValue = gameLocalStore.getState().getValue(path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<gameLocalDoc, Path>>(initialValue)

  // Store the original value from the store (only used in save mode)
  const [originalValue, setOriginalValue] = useState<Get<gameLocalDoc, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = gameLocalStore.getState().getValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
      if (saveMode) {
        setOriginalValue(currentValue)
      }
    }

    const unsubscribe = gameLocalStore.subscribe((state) => {
      const newValue = state.getValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
        if (saveMode) {
          setOriginalValue(newValue)
        }
      }
    })

    return unsubscribe
  }, [gameId, path, saveMode])

  const setValue = useCallback(
    async (newValue: Get<gameLocalDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      if (saveMode) {
        // Save mode: Only update local state, don't modify the store
        setLocalValue(newValue)
      } else {
        // Immediate mode: Update local state first for immediate response
        setLocalValue(newValue)
        // Then update the store
        return gameLocalStore.getState().setValue(path, newValue)
      }
    },
    [saveMode, localValue, gameLocalStore, path]
  )

  const save = useCallback(async () => {
    if (!saveMode) return

    // 使用 ref 中的最新值，而不是闭包捕获的 localValue
    const currentValue = localValueRef.current

    if (isEqual(currentValue, originalValue)) return

    // 应用本地更改到存储
    await gameLocalStore.getState().setValue(path, currentValue)

    // 更新原始值以匹配保存的值
    setOriginalValue(currentValue)
  }, [saveMode, path, originalValue, gameLocalStore])

  const setValueAndSave = useCallback(
    async (newValue: Get<gameLocalDoc, Path>) => {
      if (isEqual(newValue, localValue) || !saveMode) return

      // 更新本地状态
      setLocalValue(newValue)

      // 直接保存到 store
      await gameLocalStore.getState().setValue(path, newValue)

      setOriginalValue(newValue)
    },
    [localValue, gameLocalStore, path, saveMode]
  )

  if (saveMode) {
    return [localValue, setValue, save, setValueAndSave] as any
  } else {
    return [localValue, setValue] as any
  }
}
