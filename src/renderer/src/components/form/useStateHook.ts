import { useConfigState } from '~/hooks/useConfigState'
import { useConfigLocalState } from '~/hooks/useConfigLocalState'
import { useGameState } from '~/hooks/useGameState'
import { useGameLocalState } from '~/hooks/useGameLocalState'
import { useGameCollectionState } from '~/hooks/useGameCollectionState'
import type { HookType, DocType } from './types'
import type { Paths, Get } from 'type-fest'
import { usePluginState } from '~/hooks'

/**
 * Hook工厂函数，根据hookType返回相应的hook
 */
export function useStateHook<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>,
  SaveMode extends boolean = true
>(
  hookType: T,
  path: T extends 'plugin' ? string : Path,
  gameId: T extends 'game' | 'gameLocal' ? string : undefined,
  collectionId: T extends 'gameCollection' ? string : undefined,
  pluginId: T extends 'plugin' ? string : undefined,
  defaultValue?: T extends 'plugin' ? any : undefined,
  saveMode: SaveMode = true as SaveMode
): SaveMode extends true
  ? [
      Get<DocType<T>, Path>,
      (value: Get<DocType<T>, Path>) => void,
      () => Promise<void>,
      (value: Get<DocType<T>, Path>) => Promise<void>
    ]
  : [Get<DocType<T>, Path>, (value: Get<DocType<T>, Path>) => Promise<void>] {
  switch (hookType) {
    case 'config':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useConfigState(path as any, saveMode) as any
    case 'configLocal':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useConfigLocalState(path as any, saveMode) as any
    case 'game':
      if (!gameId) throw new Error('gameId is required for game hook')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useGameState(gameId, path as any, saveMode) as any
    case 'gameLocal':
      if (!gameId) throw new Error('gameId is required for gameLocal hook')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useGameLocalState(gameId, path as any, saveMode) as any
    case 'gameCollection':
      if (!collectionId) throw new Error('collectionId is required for gameCollection hook')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useGameCollectionState(collectionId, path as any, saveMode) as any
    case 'plugin':
      if (!pluginId) throw new Error('pluginId is required for plugin hook')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return usePluginState(pluginId, path as any, defaultValue, saveMode) as any
    default:
      throw new Error(`Unsupported hook type: ${hookType}`)
  }
}
