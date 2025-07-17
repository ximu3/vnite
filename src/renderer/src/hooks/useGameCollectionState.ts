import { useCallback, useEffect, useState, useRef } from 'react'
import { useGameCollectionStore } from '~/stores'
import type { gameCollectionDoc } from '@appTypes/models'
import type { Get, Paths } from 'type-fest'
import { isEqual } from 'lodash'

export function useGameCollectionState<
  Path extends Paths<gameCollectionDoc, { bracketNotation: true }>,
  SaveMode extends boolean = false
>(
  collectionId: string,
  path: Path,
  saveMode: SaveMode = false as SaveMode
): SaveMode extends true
  ? [
      Get<gameCollectionDoc, Path>,
      (value: Get<gameCollectionDoc, Path>) => void,
      () => Promise<void>
    ]
  : [Get<gameCollectionDoc, Path>, (value: Get<gameCollectionDoc, Path>) => Promise<void>] {
  const initialValue = useGameCollectionStore.getState().getGameCollectionValue(collectionId, path)

  // Use local state to store the current value
  const [localValue, setLocalValue] = useState<Get<gameCollectionDoc, Path>>(initialValue)

  // Store the original value from the store (only used in save mode)
  const [originalValue, setOriginalValue] = useState<Get<gameCollectionDoc, Path>>(initialValue)

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
      if (saveMode) {
        setOriginalValue(currentValue)
      }
    }

    const unsubscribe = useGameCollectionStore.subscribe((state) => {
      const newValue = state.getGameCollectionValue(collectionId, path)
      if (!isEqual(newValue, localValueRef.current)) {
        setLocalValue(newValue)
        if (saveMode) {
          setOriginalValue(newValue)
        }
      }
    })

    return unsubscribe
  }, [collectionId, path, saveMode])

  const setValue = useCallback(
    async (newValue: Get<gameCollectionDoc, Path>) => {
      if (isEqual(newValue, localValue)) return

      if (saveMode) {
        // Save mode: Only update local state, don't modify the store
        setLocalValue(newValue)
      } else {
        // Immediate mode: Update local state first for immediate response
        setLocalValue(newValue)
        // Then update the store
        return useGameCollectionStore
          .getState()
          .setGameCollectionValue(collectionId, path, newValue)
      }
    },
    [saveMode, localValue, collectionId, path]
  )

  const save = useCallback(async () => {
    if (!saveMode || isEqual(localValue, originalValue)) return

    // Apply the local changes to the store
    await useGameCollectionStore.getState().setGameCollectionValue(collectionId, path, localValue)

    // Update the original value to match the saved value
    setOriginalValue(localValue)
  }, [saveMode, collectionId, path, localValue, originalValue])

  if (saveMode) {
    return [localValue, setValue, save] as any
  } else {
    return [localValue, setValue] as any
  }
}
