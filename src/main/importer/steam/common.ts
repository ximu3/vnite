import { FormattedGameInfo, GetOwnedGamesResponse } from './types'
import { addGameToDatabase } from '~/adder'
import { BrowserWindow } from 'electron'
import { stopWatcher, setupWatcher } from '~/watcher'
import { rebuildIndex } from '~/database/gameIndex'
import { rebuildRecords } from '~/database/record'

/**
 * Getting information about a user's Steam library
 */
export async function getUserSteamGames(steamId: string): Promise<FormattedGameInfo[]> {
  try {
    const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/')
    url.searchParams.append('key', import.meta.env.VITE_STEAM_API_KEY)
    url.searchParams.append('steamid', steamId)
    url.searchParams.append('format', 'json')
    url.searchParams.append('include_appinfo', '1')
    url.searchParams.append('include_played_free_games', '1')

    const response = await fetch(url.toString())

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
    console.error('获取 Steam 游戏库失败:', error)
    throw error
  }
}

/**
 * Importing selected Steam games into the database
 */
export async function importSelectedSteamGames(games: FormattedGameInfo[]): Promise<number> {
  const mainWindow = BrowserWindow.getAllWindows()[0]
  stopWatcher()

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
          playingTime: game.totalPlayingTime,
          noWatcherAction: true,
          noIpcAction: true
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

    await rebuildIndex()
    await rebuildRecords()
    await setupWatcher(mainWindow)

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
