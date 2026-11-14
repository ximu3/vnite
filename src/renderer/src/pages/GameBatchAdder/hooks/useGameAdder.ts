// hooks/useGameAdder.ts
import { BatchGameInfo } from '@appTypes/models'
import i18next from 'i18next'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'
import { getLibraryDuplicateIds } from '~/utils/gameDuplicates'
import { useGameBatchAdderStore } from '../store'

async function searchGame(game: BatchGameInfo): Promise<string> {
  const result = await ipcManager.invoke('scraper:search-games', game.dataSource, game.name)
  if (result.length === 0) {
    throw new Error(i18next.t('adder:gameBatchAdder.errors.gameNotFound', { name: game.name }))
  }
  return result[0].id
}

export const useGameAdder = (): {
  addGame: (dataId: string, skipDuplicateCheck?: boolean) => Promise<'review' | void>
  addAllGames: () => Promise<void>
} => {
  const { t } = useTranslation('adder')

  const addGame = useCallback(
    async (dataId: string, skipDuplicateCheck = false): Promise<'review' | void> => {
      const { games, enableUpscale, actions } = useGameBatchAdderStore.getState()
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
      if (game.duplicateIds && !skipDuplicateCheck) return 'review'

      try {
        actions.updateGame(dataId, { status: 'loading' })

        let gameId = game.id
        if (!gameId) {
          gameId = await searchGame(game)
          actions.updateGame(dataId, { id: gameId })
        }

        if (!skipDuplicateCheck) {
          const metadata = await ipcManager.invoke('scraper:get-game-metadata', game.dataSource, {
            type: 'id',
            value: gameId
          })
          if (!metadata) throw new Error(t('gameBatchAdder.errors.metadataUnavailable'))
          const duplicateIds = getLibraryDuplicateIds({
            name: metadata.name,
            originalName: metadata.originalName,
            dataSource: game.dataSource,
            dataSourceId: gameId
          })
          if (duplicateIds.length) {
            actions.updateGame(dataId, { status: 'review', duplicateIds })
            return 'review'
          }
        }

        await ipcManager.invoke('adder:add-game-to-db', {
          dataSource: game.dataSource,
          dataSourceId: gameId,
          upscaleEnabled: enableUpscale,
          dirPath: game.dirPath
        })

        actions.updateGame(dataId, { status: 'success', duplicateIds: undefined })
      } catch (error) {
        actions.updateGame(dataId, { status: 'error' })
        throw error
      }
    },
    [t]
  )

  const addAllGames = useCallback(async () => {
    const { games } = useGameBatchAdderStore.getState()
    const pendingGames = games.filter((g) => g.status !== 'success' && !g.duplicateIds)
    for (const game of pendingGames) {
      try {
        await addGame(game.dataId)
      } catch (error) {
        console.error(`Failed to add game ${game.name}:`, error)
      }
    }
  }, [addGame])

  return { addGame, addAllGames }
}
