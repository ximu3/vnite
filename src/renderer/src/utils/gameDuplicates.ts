import type { gameDoc } from '@appTypes/models'
import { jaro } from '@appUtils'
import { useGameRegistry } from '~/stores/game/gameRegistry'
import { getGameStore } from '~/stores/game/gameStoreFactory'

const DUPLICATE_NAME_THRESHOLD = 0.97

export interface DuplicateCheckInput {
  name: string
  originalName?: string | null
  dataSource?: string
  dataSourceId?: string
}

/** Read provider IDs without assuming that every provider is declared in gameDoc. */
function getDataSourceId(metadata: gameDoc['metadata'], dataSource: string): string {
  const value: unknown = Reflect.get(metadata, `${dataSource}Id`)
  return typeof value === 'string' ? value : ''
}

/** Compare the stored strings as-is; formatting belongs to the data source. */
function findDuplicateGameIds(candidate: DuplicateCheckInput, games: readonly gameDoc[]): string[] {
  const matches: { gameId: string; idMatch: boolean; nameScore: number }[] = []

  for (const game of games) {
    if (!game?.metadata) continue
    const idMatch = Boolean(
      candidate.dataSource &&
        candidate.dataSourceId &&
        getDataSourceId(game.metadata, candidate.dataSource) === candidate.dataSourceId
    )
    let nameScore = 0

    if (candidate.name && game.metadata.name) {
      nameScore = jaro(candidate.name, game.metadata.name)
    }
    if (candidate.originalName && game.metadata.originalName) {
      nameScore = Math.max(nameScore, jaro(candidate.originalName, game.metadata.originalName))
    }

    if (idMatch || nameScore >= DUPLICATE_NAME_THRESHOLD)
      matches.push({ gameId: game._id, idMatch, nameScore })
  }

  return matches
    .sort((a, b) => Number(b.idMatch) - Number(a.idMatch) || b.nameScore - a.nameScore)
    .map((match) => match.gameId)
}

export function getLibraryDuplicateIds(candidate: DuplicateCheckInput): string[] {
  const registry = useGameRegistry.getState()
  const games = registry.gameIds
    .map((id) => getGameStore(id).getState().data)
    .filter((game): game is gameDoc => Boolean(game))
  return findDuplicateGameIds(candidate, games)
}
