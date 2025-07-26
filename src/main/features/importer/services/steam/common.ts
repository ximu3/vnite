import { GetOwnedGamesResponse } from './types'
import { SteamFormattedGameInfo } from '@appTypes/utils'
import { addGameToDB } from '~/features/adder'
import { ipcManager } from '~/core/ipc'
import { net } from 'electron'

export async function getUserSteamGames(steamId: string): Promise<SteamFormattedGameInfo[]> {
  const endpoints = ['https://api.steampowered.com']

  const searchParams = new URLSearchParams({
    key: import.meta.env.VITE_STEAM_API_KEY,
    steamid: steamId,
    format: 'json',
    include_appinfo: '1',
    include_played_free_games: '1'
  })

  let lastError: Error | null = null

  for (const baseUrl of endpoints) {
    try {
      const url = `${baseUrl}/IPlayerService/GetOwnedGames/v0001/?${searchParams}`
      const response = await net.fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()) as GetOwnedGamesResponse

      if (!data.response || !data.response.games) {
        throw new Error('Invalid response format or empty game library')
      }

      return data.response.games.map((game) => ({
        appId: game.appid,
        name: game.name,
        totalPlayingTime: game.playtime_forever * 60 * 1000
      }))
    } catch (error) {
      lastError = error as Error
      console.warn(`Failed to fetch from ${baseUrl}:`, error)
      continue
    }
  }

  console.error('Failed to get Steam game library:', lastError)
  throw lastError || new Error('All endpoints failed')
}

export async function importSelectedSteamGames(games: SteamFormattedGameInfo[]): Promise<number> {
  try {
    const totalGames = games.length

    if (totalGames === 0) {
      ipcManager.send('importer:import-steam-games-progress', {
        current: 0,
        total: 0,
        status: 'completed',
        message: 'No selection of games to import'
      })
      return 0
    }

    // Send initial progress
    ipcManager.send('importer:import-steam-games-progress', {
      current: 0,
      total: totalGames,
      status: 'started',
      message: 'Start adding games...'
    })

    // Add games to the database one by one
    for (let i = 0; i < games.length; i++) {
      const game = games[i]
      try {
        await addGameToDB({
          dataSource: 'steam',
          dataSourceId: game.appId.toString(),
          playTime: game.totalPlayingTime
        })

        // Send progress updates
        ipcManager.send('importer:import-steam-games-progress', {
          current: i + 1,
          total: totalGames,
          status: 'processing',
          message: `Adding: ${game.name}`,
          game: {
            name: game.name,
            status: 'success'
          }
        })
      } catch (error) {
        // Send an error message but continue processing
        ipcManager.send('importer:import-steam-games-progress', {
          current: i + 1,
          total: totalGames,
          status: 'processing',
          message: `Add Failure: ${game.name}`,
          game: {
            name: game.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'unknown error'
          }
        })
      }

      // Add small delays to avoid database stress
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Send a completion message
    ipcManager.send('importer:import-steam-games-progress', {
      current: totalGames,
      total: totalGames,
      status: 'completed',
      message: 'Game additions completed'
    })

    return totalGames
  } catch (error) {
    // Send an error message
    ipcManager.send('importer:import-steam-games-progress', {
      current: 0,
      total: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to import game'
    })
    console.error('Failed to import Steam games:', error)
    throw error
  }
}
