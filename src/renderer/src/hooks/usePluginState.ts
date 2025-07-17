import { useCallback, useEffect, useState, useRef } from 'react'
import { usePluginStore } from '~/stores'
import { isEqual } from 'lodash'

/**
 * 插件状态Hook - 简单版本，参照useGameState设计
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
  ? [T, (value: T) => void, () => Promise<void>]
  : [T, (value: T) => Promise<void>] {
  const pluginStore = usePluginStore()
  const initialValue = pluginStore.getPluginValue(pluginId, key, defaultValue)

  // 使用本地状态存储当前值
  const [localValue, setLocalValue] = useState<T>(initialValue)

  // 存储来自store的原始值（仅在保存模式下使用）
  const [originalValue, setOriginalValue] = useState<T>(initialValue)

  // 使用ref存储最新的本地值
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // 订阅store变化
  useEffect(() => {
    // 获取初始值并确保与store同步
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
        // 保存模式：只更新本地状态，不修改store
        setLocalValue(newValue)
      } else {
        // 立即模式：先更新本地状态以获得即时响应
        setLocalValue(newValue)
        // 然后更新store
        return usePluginStore.getState().setPluginValue(pluginId, key, newValue)
      }
    },
    [saveMode, localValue, pluginId, key]
  )

  const save = useCallback(async () => {
    if (!saveMode || isEqual(localValue, originalValue)) return

    // 将本地更改应用到store
    await usePluginStore.getState().setPluginValue(pluginId, key, localValue)

    // 更新原始值以匹配保存的值
    setOriginalValue(localValue)
  }, [saveMode, pluginId, key, localValue, originalValue])

  if (saveMode) {
    return [localValue, setValue, save] as any
  } else {
    return [localValue, setValue] as any
  }
}
