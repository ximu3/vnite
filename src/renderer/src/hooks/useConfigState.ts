import { useCallback, useEffect, useState, useRef } from 'react'
import { useConfigStore } from '~/stores'
import type { configDocs } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useConfigState<Path extends Paths<configDocs, { bracketNotation: true }>>(
  path: Path
): [Get<configDocs, Path>, (value: Get<configDocs, Path>) => Promise<void>] {
  const initialValue = useConfigStore.getState().getConfigValue(path)

  // 使用本地状态存储当前值
  const [localValue, setLocalValue] = useState<Get<configDocs, Path>>(initialValue)

  // 使用 ref 存储最新的本地值
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // 订阅 store 的更改
  useEffect(() => {
    // 获取初始值，确保与 store 同步
    const currentValue = useConfigStore.getState().getConfigValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    // 订阅 store 的更改
    const unsubscribe = useConfigStore.subscribe((state) => {
      const newValue = state.getConfigValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [path]) // 只依赖 path，避免不必要的重新订阅

  // 更新函数
  const setValue = useCallback(
    async (newValue: Get<configDocs, Path>) => {
      if (isEqual(newValue, localValue)) return

      // 先更新本地状态以立即响应
      setLocalValue(newValue)

      // 然后更新 store
      return useConfigStore.getState().setConfigValue(path, newValue)
    },
    [path, localValue]
  )

  return [localValue, setValue]
}
