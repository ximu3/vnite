import { useCallback, useEffect, useState, useRef } from 'react'
import { getGameLocalStore } from '~/stores/game/gameLocalStoreFactory'
import type { gameLocalDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useGameLocalState<Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
  gameId: string,
  path: Path
): [Get<gameLocalDoc, Path>, (value: Get<gameLocalDoc, Path>) => Promise<void>] {
  const gameLocalStore = getGameLocalStore(gameId)
  const initialValue = gameLocalStore.getState().getValue(path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<gameLocalDoc, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = gameLocalStore.getState().getValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    const unsubscribe = gameLocalStore.subscribe((state) => {
      const newValue = state.getValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [gameId, path])

  const setValue = useCallback(
    async (newValue: Get<gameLocalDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      // Update local state first for immediate response
      setLocalValue(newValue)

      // Then update the store
      return gameLocalStore.getState().setValue(path, newValue)
    },
    [gameId, path, localValue]
  )

  return [localValue, setValue]
}
