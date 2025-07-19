import { useCallback, useEffect, useState, useRef } from 'react'
import { useConfigStore } from '~/stores'
import type { configDocs } from '@appTypes/models'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useConfigState<
  Path extends Paths<configDocs, { bracketNotation: true }>,
  SaveMode extends boolean = false
>(
  path: Path,
  saveMode: SaveMode = false as SaveMode
): SaveMode extends true
  ? [
      Get<configDocs, Path>,
      (value: Get<configDocs, Path>) => void,
      () => Promise<void>,
      (value: Get<configDocs, Path>) => Promise<void>
    ]
  : [Get<configDocs, Path>, (value: Get<configDocs, Path>) => Promise<void>] {
  const initialValue = useConfigStore.getState().getConfigValue(path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<configDocs, Path>>(initialValue)

  // Store the original value from the store (only used in save mode)
  const [originalValue, setOriginalValue] = useState<Get<configDocs, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Changes to the subscription store
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = useConfigStore.getState().getConfigValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
      if (saveMode) {
        setOriginalValue(currentValue)
      }
    }

    const unsubscribe = useConfigStore.subscribe((state) => {
      const newValue = state.getConfigValue(path)
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
    async (newValue: Get<configDocs, Path>) => {
      if (isEqual(newValue, localValue)) return

      if (saveMode) {
        // Save mode: Only update local state, don't modify the store
        setLocalValue(newValue)
      } else {
        // Immediate mode: Update local state first for immediate response
        setLocalValue(newValue)
        // Then update the store
        return useConfigStore.getState().setConfigValue(path, newValue)
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
    await useConfigStore.getState().setConfigValue(path, currentValue)

    // Update the original value to match the saved value
    setOriginalValue(currentValue)
  }, [saveMode, path, originalValue])

  const setValueAndSave = useCallback(
    async (newValue: Get<configDocs, Path>) => {
      if (isEqual(newValue, localValue) || !saveMode) return

      // 更新本地状态
      setLocalValue(newValue)

      // 直接保存到 store
      await useConfigStore.getState().setConfigValue(path, newValue)

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
