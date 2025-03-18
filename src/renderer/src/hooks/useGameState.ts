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

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<gameDoc, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = gameStore.getState().getValue(path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    const unsubscribe = gameStore.subscribe((state) => {
      const newValue = state.getValue(path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [gameId, path])

  const setValue = useCallback(
    async (newValue: Get<gameDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      // Update local state first for immediate response
      setLocalValue(newValue)

      // Then update the store
      return gameStore.getState().setValue(path, newValue)
    },
    [gameId, path, localValue]
  )

  return [localValue, setValue]
}
