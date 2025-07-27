import { useCallback, useEffect, useState, useRef } from 'react'
import { usePluginStore } from '~/stores'
import { isEqual } from 'lodash'

/**
 * 插件状态Hook
 *
 * @param pluginId 插件ID
 * @param key 数据键
 * @param defaultValue 默认值
 * @param saveMode 是否为保存模式（本地编辑，手动保存）
 */
export function usePluginState<T = any, SaveMode extends boolean = false>(
  pluginId: string,
  key: string,
  defaultValue?: T,
  saveMode: SaveMode = false as SaveMode
): SaveMode extends true
  ? [T, (value: T) => void, () => Promise<void>, (value: T) => Promise<void>]
  : [T, (value: T) => Promise<void>] {
  const pluginStore = usePluginStore()
  const initialValue = pluginStore.getPluginValue(pluginId, key, defaultValue)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<T>(initialValue)

  // Store the original value from the store (only used in save mode)
  const [originalValue, setOriginalValue] = useState<T>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = usePluginStore.getState().getPluginValue(pluginId, key, defaultValue)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
      if (saveMode) {
        setOriginalValue(currentValue)
      }
    }

    const unsubscribe = usePluginStore.subscribe((state) => {
      const newValue = state.getPluginValue(pluginId, key, defaultValue)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
        if (saveMode) {
          setOriginalValue(newValue)
        }
      }
    })

    return unsubscribe
  }, [pluginId, key, defaultValue, saveMode])

  const setValue = useCallback(
    async (newValue: T) => {
      if (isEqual(newValue, localValue)) return

      if (saveMode) {
        // Save mode: Only update local state, don't modify the store
        setLocalValue(newValue)
      } else {
        // Immediate mode: Update local state first for immediate response
        setLocalValue(newValue)
        // Then update the store
        return usePluginStore.getState().setPluginValue(pluginId, key, newValue)
      }
    },
    [saveMode, localValue, pluginId, key]
  )

  const save = useCallback(async () => {
    if (!saveMode) return

    // Get the current value from the ref
    const currentValue = localValueRef.current

    if (isEqual(currentValue, originalValue)) return

    // Apply the local changes to the store
    await usePluginStore.getState().setPluginValue(pluginId, key, currentValue)

    // Update original value to match the saved value
    setOriginalValue(currentValue)
  }, [saveMode, pluginId, key, originalValue])

  const setValueAndSave = useCallback(
    async (newValue: T) => {
      if (isEqual(newValue, localValue) || !saveMode) return

      // Update local state
      setLocalValue(newValue)

      // Save directly to store
      await usePluginStore.getState().setPluginValue(pluginId, key, newValue)

      // Update original value
      setOriginalValue(newValue)
    },
    [localValue, pluginId, key, saveMode]
  )

  if (saveMode) {
    return [localValue, setValue, save, setValueAndSave] as any
  } else {
    return [localValue, setValue] as any
  }
}
