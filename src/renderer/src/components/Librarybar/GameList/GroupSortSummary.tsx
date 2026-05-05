import type { configDocs } from '@appTypes/models/config'
import { STORAGE_SIZE_NOT_CALCULATED } from '@appTypes/models/game'
import { useEffect, useMemo, useState } from 'react'
import { useConfigState } from '~/hooks'
import { getGameStore, type SingleGameState } from '~/stores/game'
import { cn, formatDurationCompact, formatStorageSize } from '~/utils'

type GameListSortBy = configDocs['game']['gameList']['sort']['by']
type GroupSortSummaryConfigBy = configDocs['game']['gameList']['groupSortSummary']['by']
type SummarySortBy = Exclude<GroupSortSummaryConfigBy, 'none'>

type GroupSortSummaryData =
  | {
      type: 'playTime'
      totalPlayTime: number
    }
  | {
      type: 'score'
      averageScore: number
    }
  | {
      type: 'storageSize'
      totalStorageSize: number
      calculatedCount: number
      totalCount: number
    }
  | null

function isSummarySortBy(by: GameListSortBy): by is SummarySortBy {
  return by === 'record.playTime' || by === 'record.score' || by === 'record.storageSize'
}

function summariesEqual(a: GroupSortSummaryData, b: GroupSortSummaryData): boolean {
  if (a === b) return true
  if (!a || !b) return false

  if (a.type === 'playTime' && b.type === 'playTime') {
    return a.totalPlayTime === b.totalPlayTime
  }

  if (a.type === 'score' && b.type === 'score') {
    return a.averageScore === b.averageScore
  }

  if (a.type === 'storageSize' && b.type === 'storageSize') {
    return (
      a.totalStorageSize === b.totalStorageSize &&
      a.calculatedCount === b.calculatedCount &&
      a.totalCount === b.totalCount
    )
  }

  return false
}

function computeGroupSortSummary(
  gameIds: string[],
  by: SummarySortBy | null
): GroupSortSummaryData {
  if (gameIds.length === 0 || !by) {
    return null
  }

  switch (by) {
    case 'record.playTime': {
      const totalPlayTime = gameIds.reduce((total, gameId) => {
        const playTime = getGameStore(gameId).getState().getValue('record.playTime')
        return total + (Number.isFinite(playTime) ? Math.max(0, playTime) : 0)
      }, 0)

      return totalPlayTime > 0 ? { type: 'playTime', totalPlayTime } : null
    }

    case 'record.score': {
      let totalScore = 0
      let ratedCount = 0

      for (const gameId of gameIds) {
        const score = getGameStore(gameId).getState().getValue('record.score')
        if (Number.isFinite(score) && score !== -1) {
          totalScore += score
          ratedCount += 1
        }
      }

      return ratedCount > 0 ? { type: 'score', averageScore: totalScore / ratedCount } : null
    }

    case 'record.storageSize': {
      let totalStorageSize = 0
      let calculatedCount = 0

      for (const gameId of gameIds) {
        const storageSize = getGameStore(gameId).getState().getValue('record.storageSize')
        if (
          Number.isFinite(storageSize) &&
          storageSize !== STORAGE_SIZE_NOT_CALCULATED &&
          storageSize >= 0
        ) {
          totalStorageSize += storageSize
          calculatedCount += 1
        }
      }

      return calculatedCount > 0
        ? {
            type: 'storageSize',
            totalStorageSize,
            calculatedCount,
            totalCount: gameIds.length
          }
        : null
    }
  }
}

function getObservedSortValue(state: Pick<SingleGameState, 'data'>, by: SummarySortBy): number {
  switch (by) {
    case 'record.playTime':
      return state.data?.record.playTime ?? 0
    case 'record.score':
      return state.data?.record.score ?? -1
    case 'record.storageSize':
      return state.data?.record.storageSize ?? STORAGE_SIZE_NOT_CALCULATED
  }
}

const FNV_64_OFFSET_BASIS = 0xcbf29ce484222325n
const FNV_64_PRIME = 0x100000001b3n
const UINT64_MASK = (1n << 64n) - 1n

// fnv-1a 64-bit hash implementation for string inputs
function hashString64(input: string): bigint {
  let hash = FNV_64_OFFSET_BASIS

  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index))
    hash = (hash * FNV_64_PRIME) & UINT64_MASK
  }

  return hash
}

function getGameIdsMembershipHash(gameIds: string[]): string {
  const uniqueGameIds = new Set(gameIds)
  let xor = 0n
  let sum = 0n
  let count = 0

  for (const gameId of uniqueGameIds) {
    const hash = hashString64(gameId)
    xor ^= hash
    sum = (sum + hash) & UINT64_MASK
    count += 1
  }

  return `${count}:${xor.toString(16)}:${sum.toString(16)}`
}

function useGroupSortSummary(gameIds: string[], by: SummarySortBy | null): GroupSortSummaryData {
  const gameIdsMembershipHash = useMemo(() => getGameIdsMembershipHash(gameIds), [gameIds])
  const [summary, setSummary] = useState<GroupSortSummaryData>(() =>
    computeGroupSortSummary(gameIds, by)
  )

  useEffect(() => {
    const nextSummary = computeGroupSortSummary(gameIds, by)
    setSummary((prev) => (summariesEqual(prev, nextSummary) ? prev : nextSummary))

    if (!by || gameIds.length === 0) {
      return
    }

    const unsubscribes = gameIds.map((gameId) =>
      getGameStore(gameId).subscribe((state, prevState) => {
        if (getObservedSortValue(state, by) === getObservedSortValue(prevState, by)) {
          // Avoid unnecessary recomputation as much as possible
          return
        }

        const updatedSummary = computeGroupSortSummary(gameIds, by)
        setSummary((prev) => (summariesEqual(prev, updatedSummary) ? prev : updatedSummary))
      })
    )

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [by, gameIdsMembershipHash])

  return summary
}

function resolveSummarySortBy(
  currentSortBy: GameListSortBy,
  configuredBy: GroupSortSummaryConfigBy,
  followSort: boolean
): SummarySortBy | null {
  if (followSort && isSummarySortBy(currentSortBy)) {
    return currentSortBy
  }

  return configuredBy === 'none' ? null : configuredBy
}

export function GroupSortSummary({
  gameIds,
  by,
  className
}: {
  gameIds: string[]
  by: GameListSortBy
  className?: string
}): React.JSX.Element | null {
  const [configuredBy] = useConfigState('game.gameList.groupSortSummary.by')
  const [followSort] = useConfigState('game.gameList.groupSortSummary.followSort')
  const effectiveBy = resolveSummarySortBy(by, configuredBy, followSort)

  const summary = useGroupSortSummary(gameIds, effectiveBy)

  if (!summary) {
    return null
  }

  let content: string | null = null
  switch (summary.type) {
    case 'playTime':
      content = `(${formatDurationCompact(summary.totalPlayTime)})`
      break
    case 'score':
      if (summary.averageScore < 0) {
        return null
      }
      content = `(avg: ${summary.averageScore.toFixed(1)})`
      break
    case 'storageSize':
      if (summary.totalStorageSize <= 0) {
        return null
      }
      content = `(${formatStorageSize(summary.totalStorageSize)}${
        summary.calculatedCount < summary.totalCount
          ? `, ${summary.calculatedCount}/${summary.totalCount}`
          : ''
      })`
      break
  }

  return <span className={cn('text-2xs text-foreground/50', className)}>{content}</span>
}
