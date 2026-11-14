import { createContext, useContext, type MouseEvent } from 'react'
import { useGameBatchEditorStore, type SelectionAnchor, type SelectionScope } from './store'

export const GameSelectionContext = createContext<SelectionScope | null>(null)

interface GameSelectionOptions {
  clearOnNormalClick?: boolean
  onNormalClick?: () => void
}

// Resolve ranges from the full displayed order, including unmounted virtual items.
function resolveSelectionRange(
  scope: SelectionScope,
  anchor: SelectionAnchor | null,
  gameId: string
): string[] | null {
  const currentIndex = scope.orderedGameIds.indexOf(gameId)
  const anchorIndex =
    anchor?.scopeId === scope.scopeId ? scope.orderedGameIds.indexOf(anchor.gameId) : -1

  if (!anchor || anchorIndex === -1 || currentIndex === -1) {
    return null
  }

  return scope.orderedGameIds.slice(
    Math.min(anchorIndex, currentIndex),
    Math.max(anchorIndex, currentIndex) + 1
  )
}

export function useGameSelection(
  gameId: string,
  { clearOnNormalClick = false, onNormalClick }: GameSelectionOptions = {}
): {
  handleSelect: (event: MouseEvent) => void
  handleGameClick: (event: MouseEvent) => void
} {
  // The list provider owns the anchor lifetime, including virtual items.
  const scope = useContext(GameSelectionContext)
  if (scope === null) {
    throw new Error('useGameSelection must be used within GameSelectionProvider')
  }

  const handleSelect = (event: MouseEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    const store = useGameBatchEditorStore.getState()
    if (event.shiftKey) {
      const range = resolveSelectionRange(scope, store.selectionAnchor, gameId)
      store.updateSelection({
        gameIds: range ?? [gameId],
        mode: event.ctrlKey ? 'add' : 'replace',
        ...(range === null ? { anchor: { scopeId: scope.scopeId, gameId } } : {})
      })
    } else {
      // A single-item toggle establishes an anchor even when deselecting the game.
      store.updateSelection({
        gameIds: [gameId],
        mode: 'toggle',
        anchor: { scopeId: scope.scopeId, gameId }
      })
    }
  }

  const handleGameClick = (event: MouseEvent): void => {
    if (event.shiftKey || event.ctrlKey) {
      handleSelect(event)
      return
    }
    const store = useGameBatchEditorStore.getState()
    const anchor = { scopeId: scope.scopeId, gameId }
    // GameNav clears selection and sets the anchor atomically; posters keep the selection.
    if (clearOnNormalClick) {
      store.updateSelection({ gameIds: [], mode: 'replace', anchor })
    } else {
      store.setSelectionAnchor(anchor)
    }
    // GameNav's link handles navigation; posters navigate in the callback.
    onNormalClick?.()
  }

  return { handleSelect, handleGameClick }
}
