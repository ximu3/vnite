import { FormattedGameInfo, GetOwnedGamesResponse } from './types'
import { addGameToDatabase } from '~/adder'
import { BrowserWindow } from 'electron'

/**
 * Getting information about a user's Steam library
 */
export async function getUserSteamGames(steamId: string): Promise<FormattedGameInfo[]> {
  const endpoints = ['https://api.steampowered.com', 'https://api.ximu.dev/steam/api']

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
      const response = await fetch(url)

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

  console.error('获取 Steam 游戏库失败:', lastError)
  throw lastError || new Error('All endpoints failed')
}

/**
 * Importing selected Steam games into the database
 */
export async function importSelectedSteamGames(games: FormattedGameInfo[]): Promise<number> {
  const mainWindow = BrowserWindow.getAllWindows()[0]

  try {
    const totalGames = games.length

    if (totalGames === 0) {
      mainWindow.webContents.send('import-steam-games-progress', {
        current: 0,
        total: 0,
        status: 'completed',
        message: '没有选择要导入的游戏'
      })
      return 0
    }

    // Send initial progress
    mainWindow.webContents.send('import-steam-games-progress', {
      current: 0,
      total: totalGames,
      status: 'started',
      message: '开始添加游戏...'
    })

    // Add games to the database one by one
    for (let i = 0; i < games.length; i++) {
      const game = games[i]
      try {
        await addGameToDatabase({
          dataSource: 'steam',
          id: game.appId.toString(),
          playTime: game.totalPlayingTime
        })

        // Send progress updates
        mainWindow.webContents.send('import-steam-games-progress', {
          current: i + 1,
          total: totalGames,
          status: 'processing',
          message: `正在添加: ${game.name}`,
          game: {
            name: game.name,
            status: 'success'
          }
        })
      } catch (error) {
        // Send an error message but continue processing
        mainWindow.webContents.send('import-steam-games-progress', {
          current: i + 1,
          total: totalGames,
          status: 'processing',
          message: `添加失败: ${game.name}`,
          game: {
            name: game.name,
            status: 'error',
            error: error instanceof Error ? error.message : '未知错误'
          }
        })
      }

      // Add small delays to avoid database stress
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Send a completion message
    mainWindow.webContents.send('import-steam-games-progress', {
      current: totalGames,
      total: totalGames,
      status: 'completed',
      message: '游戏添加完成'
    })

    return totalGames
  } catch (error) {
    // Send an error message
    mainWindow.webContents.send('import-steam-games-progress', {
      current: 0,
      total: 0,
      status: 'error',
      message: error instanceof Error ? error.message : '导入游戏失败'
    })
    throw error
  }
}
