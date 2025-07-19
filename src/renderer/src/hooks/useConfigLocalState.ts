import { useCallback, useEffect, useState, useRef } from 'react'
import { useConfigLocalStore } from '~/stores'
import type { configLocalDocs } from '@appTypes/models'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useConfigLocalState<
  Path extends Paths<configLocalDocs, { bracketNotation: true }>,
  SaveMode extends boolean = false
>(
  path: Path,
  saveMode: SaveMode = false as SaveMode
): SaveMode extends true
  ? [
      Get<configLocalDocs, Path>,
      (value: Get<configLocalDocs, Path>) => void,
      () => Promise<void>,
      (value: Get<configLocalDocs, Path>) => Promise<void>
    ]
  : [Get<configLocalDocs, Path>, (value: Get<configLocalDocs, Path>) => Promise<void>] {
  const initialValue = useConfigLocalStore.getState().getConfigLocalValue(path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<configLocalDocs, Path>>(initialValue)

  // Store the original value from the store (only used in save mode)
  const [originalValue, setOriginalValue] = useState<Get<configLocalDocs, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = useConfigLocalStore.getState().getConfigLocalValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
      if (saveMode) {
        setOriginalValue(currentValue)
      }
    }

    const unsubscribe = useConfigLocalStore.subscribe((state) => {
      const newValue = state.getConfigLocalValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
        if (saveMode) {
          setOriginalValue(newValue)
        }
      }
    })

    return unsubscribe
  }, [path, saveMode])

  const setValue = useCallback(
    async (newValue: Get<configLocalDocs, Path>) => {
      if (isEqual(newValue, localValue)) return

      if (saveMode) {
        // Save mode: Only update local state, don't modify the store
        setLocalValue(newValue)
      } else {
        // Immediate mode: Update local state first for immediate response
        setLocalValue(newValue)
        // Then update the store
        return useConfigLocalStore.getState().setConfigLocalValue(path, newValue)
      }
    },
    [saveMode, localValue, path]
  )

  const save = useCallback(async () => {
    if (!saveMode) return

    // 使用 ref 中的最新值，而不是闭包捕获的 localValue
    const currentValue = localValueRef.current

    if (isEqual(currentValue, originalValue)) return

    // Apply the local changes to the store
    await useConfigLocalStore.getState().setConfigLocalValue(path, currentValue)

    // Update the original value to match the saved value
    setOriginalValue(currentValue)
  }, [saveMode, path, originalValue])

  const setValueAndSave = useCallback(
    async (newValue: Get<configLocalDocs, Path>) => {
      if (isEqual(newValue, localValue) || !saveMode) return

      // 更新本地状态
      setLocalValue(newValue)

      // 直接保存到 store
      await useConfigLocalStore.getState().setConfigLocalValue(path, newValue)

      // 更新原始值
      setOriginalValue(newValue)
    },
    [localValue, path, saveMode]
  )

  if (saveMode) {
    return [localValue, setValue, save, setValueAndSave] as any
  } else {
    return [localValue, setValue] as any
  }
}
