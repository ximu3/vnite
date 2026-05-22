import type { Loadable } from './store'

export type LoadableViewState<T> =
  | {
      kind: 'loading'
    }
  | {
      kind: 'error'
      error: string
    }
  | {
      kind: 'ready'
      data: T
      staleError: string | null
    }

export function filterPieChartDataByMinimumPercent<T extends { value: number }>(
  items: T[],
  minimumPercent: number
): T[] {
  const validItems = items.filter((item) => item.value > 0)
  const totalValue = validItems.reduce((sum, item) => sum + item.value, 0)

  if (totalValue <= 0) return []

  return validItems.filter((item) => item.value / totalValue >= minimumPercent)
}

export function resolveLoadableViewState<T>(
  loadable: Loadable<T> | undefined
): LoadableViewState<T> {
  if (loadable?.data) {
    return {
      kind: 'ready',
      data: loadable.data,
      staleError: loadable.error
    }
  }

  if (loadable?.status === 'error') {
    return {
      kind: 'error',
      error: loadable.error ?? ''
    }
  }

  return {
    kind: 'loading'
  }
}
