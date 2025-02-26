import { useCallback } from 'react'
import { useConfigStore } from '~/stores'
import type { configDocs } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export function useConfigState<Path extends Paths<configDocs, { bracketNotation: true }>>(
  path: Path
): [Get<configDocs, Path>, (value: Get<configDocs, Path>) => Promise<void>] {
  const value = useConfigStore((state) => state.getConfigValue(path))

  const setValue = useCallback(
    (newValue: Get<configDocs, Path>) => {
      return useConfigStore.getState().setConfigValue(path, newValue)
    },
    [path]
  )

  return [value, setValue]
}
