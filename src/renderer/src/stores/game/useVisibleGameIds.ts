import { LocalGameFilterMode, NSFWFilterMode } from '@appTypes/models'
import { useMemo } from 'react'
import { useConfigState } from '~/hooks'
import { type GamePathInfo, useGamePathStore } from './gamePathStore'
import { type GameMetaInfo, useGameRegistry } from './gameRegistry'

/**
 * Normalize user input and stored paths into a case-insensitive comparable form
 * that always uses forward slashes.
 */
function normalizeFilterPath(path: string): string {
  const normalized = path.trim().replace(/\\/g, '/')
  if (!normalized) return ''
  return normalized.replace(/\/+$/, '').toLowerCase()
}

/**
 * Custom name filters require an exact match against either localized or original names.
 */
function matchesExcludedName(
  metaInfo: GameMetaInfo | undefined,
  excludedNames: Set<string>
): boolean {
  if (excludedNames.size === 0 || !metaInfo) return false

  const candidateNames = [metaInfo.name, metaInfo.originalName]
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name))

  return candidateNames.some((name) => excludedNames.has(name))
}

/**
 * Path filters exclude the exact path itself and anything under that normalized prefix.
 */
function matchesExcludedPath(
  metaInfo: GameMetaInfo | undefined,
  normalizedExcludedPathPrefixes: readonly string[]
): boolean {
  if (normalizedExcludedPathPrefixes.length === 0 || !metaInfo?.gamePath) return false

  const normalizedGamePath = normalizeFilterPath(metaInfo.gamePath)
  if (!normalizedGamePath) return false

  return normalizedExcludedPathPrefixes.some((prefix) => {
    if (!prefix) return false
    const boundaryPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`
    return normalizedGamePath === prefix || normalizedGamePath.startsWith(boundaryPrefix)
  })
}

function checkGameVisibility(
  metaInfo: GameMetaInfo | undefined,
  paths: Record<string, GamePathInfo>,
  nsfwFilterMode: NSFWFilterMode,
  localFilterMode: LocalGameFilterMode,
  customVisibilityFilterEnabled: boolean,
  excludedNames: Set<string>,
  normalizedExcludedPathPrefixes: readonly string[]
): boolean {
  if (metaInfo?.nsfw !== undefined && nsfwFilterMode !== NSFWFilterMode.All) {
    if (nsfwFilterMode === NSFWFilterMode.HideNSFW && metaInfo.nsfw) {
      return false
    }

    if (nsfwFilterMode === NSFWFilterMode.OnlyNSFW && !metaInfo.nsfw) {
      return false
    }
  }

  const gamePath = metaInfo?.gamePath || ''
  const isLocal = gamePath ? (paths[gamePath]?.valid ?? false) : false

  if (localFilterMode === LocalGameFilterMode.HideLocal && isLocal) {
    return false
  }

  if (localFilterMode === LocalGameFilterMode.OnlyLocal && !isLocal) {
    return false
  }

  if (
    customVisibilityFilterEnabled &&
    (matchesExcludedName(metaInfo, excludedNames) ||
      matchesExcludedPath(metaInfo, normalizedExcludedPathPrefixes))
  ) {
    return false
  }

  return true
}

export function useVisibleGameIds(sourceGameIds?: readonly string[]): string[] {
  const registryGameIds = useGameRegistry((state) => state.gameIds)
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const paths = useGamePathStore((state) => state.paths)
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const [localFilterMode] = useConfigState('appearances.localGameFilterMode')
  const [customVisibilityFilterEnabled] = useConfigState(
    'appearances.customVisibilityFilter.enabled'
  )
  const [excludedPathPrefixes] = useConfigState(
    'appearances.customVisibilityFilter.excludedPathPrefixes'
  )
  const [excludedGameNames] = useConfigState('appearances.customVisibilityFilter.excludedGameNames')
  const normalizedExcludedPathPrefixes = useMemo(
    () =>
      excludedPathPrefixes
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((path) => normalizeFilterPath(path)),
    [excludedPathPrefixes]
  )
  const excludedNames = useMemo(
    () => new Set(excludedGameNames.map((entry) => entry.trim()).filter(Boolean)),
    [excludedGameNames]
  )

  return useMemo(() => {
    const gameIds = sourceGameIds ? Array.from(sourceGameIds) : registryGameIds

    return gameIds.filter((gameId) =>
      checkGameVisibility(
        gameMetaIndex[gameId],
        paths,
        nsfwFilterMode,
        localFilterMode,
        customVisibilityFilterEnabled,
        excludedNames,
        normalizedExcludedPathPrefixes
      )
    )
  }, [
    sourceGameIds,
    registryGameIds,
    gameMetaIndex,
    paths,
    nsfwFilterMode,
    localFilterMode,
    customVisibilityFilterEnabled,
    excludedNames,
    normalizedExcludedPathPrefixes
  ])
}
