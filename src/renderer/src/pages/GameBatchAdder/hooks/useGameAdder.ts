// hooks/useGameAdder.ts
import { useCallback } from 'react'
import { useGameBatchAdderStore } from '../store'
import type { Game } from '../store'
import { ipcInvoke } from '~/utils'
import { useTranslation } from 'react-i18next'

export const useGameAdder = (): {
  addGame: (dataId: string) => Promise<void>
  addAllGames: () => Promise<void>
} => {
  const { t } = useTranslation('adder')
  const { games, actions } = useGameBatchAdderStore()

  const searchGame = async (game: Game): Promise<string> => {
    const result = (await ipcInvoke('search-games', game.dataSource, game.name)) as Game[]
    if (result.length === 0) {
      throw new Error(t('gameBatchAdder.errors.gameNotFound', { name: game.name }))
    }
    return result[0].id
  }

  const addGame = useCallback(
    async (dataId: string) => {
      const game = games.find((g) => g.dataId === dataId)
      if (!game) return

      if (game.status === 'loading') {
        throw new Error(t('gameBatchAdder.errors.gameIsBeingAdded'))
      }

      if (game.status === 'existed') {
        throw new Error(t('gameBatchAdder.errors.gameAlreadyExists'))
      }

      if (game.status === 'success') {
        throw new Error(t('gameBatchAdder.errors.gameAlreadyAdded'))
      }

      try {
        actions.updateGame(dataId, { status: 'loading' })

        let gameId = game.id
        if (!gameId) {
          gameId = await searchGame(game)
          actions.updateGame(dataId, { id: gameId })
        }

        await ipcInvoke('add-game-to-db', {
          dataSource: game.dataSource,
          dataSourceId: gameId,
          dirPath: game.dirPath
        })

        actions.updateGame(dataId, { status: 'success' })
      } catch (error) {
        actions.updateGame(dataId, { status: 'error' })
        throw error
      }
    },
    [games, actions, t]
  )

  const addAllGames = useCallback(async () => {
    const pendingGames = games.filter((g) => g.status !== 'success')
    for (const game of pendingGames) {
      try {
        await addGame(game.dataId)
      } catch (error) {
        console.error(`Failed to add game ${game.name}:`, error)
      }
    }
  }, [games, addGame])

  return { addGame, addAllGames }
}
