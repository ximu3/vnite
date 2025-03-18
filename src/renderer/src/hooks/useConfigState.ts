import { useCallback, useEffect, useState, useRef } from 'react'
import { useConfigStore } from '~/stores'
import type { configDocs } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useConfigState<Path extends Paths<configDocs, { bracketNotation: true }>>(
  path: Path
): [Get<configDocs, Path>, (value: Get<configDocs, Path>) => Promise<void>] {
  const initialValue = useConfigStore.getState().getConfigValue(path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<configDocs, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Changes to the subscription store
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = useConfigStore.getState().getConfigValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    const unsubscribe = useConfigStore.subscribe((state) => {
      const newValue = state.getConfigValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [path])

  const setValue = useCallback(
    async (newValue: Get<configDocs, Path>) => {
      if (isEqual(newValue, localValue)) return

      // Update local state first for immediate response
      setLocalValue(newValue)

      // Then update the store
      return useConfigStore.getState().setConfigValue(path, newValue)
    },
    [path, localValue]
  )

  return [localValue, setValue]
}
