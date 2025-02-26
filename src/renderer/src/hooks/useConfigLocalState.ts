import { useCallback } from 'react'
import { useConfigLocalStore } from '~/stores'
import type { configLocalDocs } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export function useConfigLocalState<Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
  path: Path
): [Get<configLocalDocs, Path>, (value: Get<configLocalDocs, Path>) => Promise<void>] {
  const value = useConfigLocalStore((state) => state.getConfigLocalValue(path))

  const setValue = useCallback(
    (newValue: Get<configLocalDocs, Path>) => {
      return useConfigLocalStore.getState().setConfigLocalValue(path, newValue)
    },
    [path]
  )

  return [value, setValue]
}
