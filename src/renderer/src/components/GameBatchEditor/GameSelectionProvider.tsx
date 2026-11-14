import { useEffect, useMemo, type ReactNode } from 'react'
import { useGameBatchEditorStore, type SelectionScope } from './store'
import { GameSelectionContext } from './useGameSelection'

export function GameSelectionProvider({
  scopeId,
  orderedGameIds,
  children
}: SelectionScope & { children: ReactNode }): React.JSX.Element {
  const value = useMemo(() => ({ scopeId, orderedGameIds }), [scopeId, orderedGameIds])

  // Removing a list (including collapsed accordion content) invalidates its anchor.
  useEffect(() => () => useGameBatchEditorStore.getState().clearSelectionAnchor(scopeId), [scopeId])

  // Reordering preserves the anchor; filtering or deleting it does not.
  useEffect(() => {
    const store = useGameBatchEditorStore.getState()
    if (
      store.selectionAnchor?.scopeId === scopeId &&
      !orderedGameIds.includes(store.selectionAnchor.gameId)
    ) {
      store.clearSelectionAnchor(scopeId)
    }
  }, [scopeId, orderedGameIds])

  return <GameSelectionContext.Provider value={value}>{children}</GameSelectionContext.Provider>
}
