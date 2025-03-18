import { useCallback, useEffect, useState, useRef } from 'react'
import { useConfigLocalStore } from '~/stores'
import type { configLocalDocs } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useConfigLocalState<Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
  path: Path
): [Get<configLocalDocs, Path>, (value: Get<configLocalDocs, Path>) => Promise<void>] {
  const initialValue = useConfigLocalStore.getState().getConfigLocalValue(path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<configLocalDocs, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = useConfigLocalStore.getState().getConfigLocalValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    const unsubscribe = useConfigLocalStore.subscribe((state) => {
      const newValue = state.getConfigLocalValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [path])

  const setValue = useCallback(
    async (newValue: Get<configLocalDocs, Path>) => {
      if (isEqual(newValue, localValue)) return

      // Update local state first for immediate response
      setLocalValue(newValue)

      // Then update the store
      return useConfigLocalStore.getState().setConfigLocalValue(path, newValue)
    },
    [path, localValue]
  )

  return [localValue, setValue]
}
