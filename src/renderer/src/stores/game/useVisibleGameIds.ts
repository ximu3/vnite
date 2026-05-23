import { LocalGameFilterMode, NSFWFilterMode } from '@appTypes/models'
import { useMemo } from 'react'
import { useConfigState } from '~/hooks'
import { type GamePathInfo, useGamePathStore } from './gamePathStore'
import { type GameMetaInfo, useGameRegistry } from './gameRegistry'

function checkGameVisibility(
  metaInfo: GameMetaInfo | undefined,
  paths: Record<string, GamePathInfo>,
  nsfwFilterMode: NSFWFilterMode,
  localFilterMode: LocalGameFilterMode
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

  return true
}

export function useVisibleGameIds(sourceGameIds?: readonly string[]): string[] {
  const registryGameIds = useGameRegistry((state) => state.gameIds)
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const paths = useGamePathStore((state) => state.paths)
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const [localFilterMode] = useConfigState('appearances.localGameFilterMode')

  return useMemo(() => {
    const gameIds = sourceGameIds ? Array.from(sourceGameIds) : registryGameIds

    return gameIds.filter((gameId) =>
      checkGameVisibility(gameMetaIndex[gameId], paths, nsfwFilterMode, localFilterMode)
    )
  }, [sourceGameIds, registryGameIds, gameMetaIndex, paths, nsfwFilterMode, localFilterMode])
}
