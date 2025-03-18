import { useCallback, useEffect, useState, useRef } from 'react'
import { useGameCollectionStore } from '~/stores'
import type { gameCollectionDoc } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useGameCollectionState<
  Path extends Paths<gameCollectionDoc, { bracketNotation: true }>
>(
  collectionId: string,
  path: Path
): [Get<gameCollectionDoc, Path>, (value: Get<gameCollectionDoc, Path>) => Promise<void>] {
  const initialValue = useGameCollectionStore.getState().getGameCollectionValue(collectionId, path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<gameCollectionDoc, Path>>(initialValue)

  // Use ref to store the latest local values
  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  // Subscribe to store changes
  useEffect(() => {
    // Get the initial value and make sure it's synchronized with the store
    const currentValue = useGameCollectionStore
      .getState()
      .getGameCollectionValue(collectionId, path)
    if (!isEqual(currentValue, localValue)) {
      setLocalValue(currentValue)
    }

    const unsubscribe = useGameCollectionStore.subscribe((state) => {
      const newValue = state.getGameCollectionValue(collectionId, path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
      }
    })

    return unsubscribe
  }, [collectionId, path])

  const setValue = useCallback(
    async (newValue: Get<gameCollectionDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      // Update local state first for immediate response
      setLocalValue(newValue)

      // Then update the store
      return useGameCollectionStore.getState().setGameCollectionValue(collectionId, path, newValue)
    },
    [collectionId, path, localValue]
  )

  return [localValue, setValue]
}
