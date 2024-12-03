import { FormattedGameInfo, GetOwnedGamesResponse } from './types'
import { addGameToDatabase } from '~/adder'
import { BrowserWindow } from 'electron'
import { stopWatcher, setupWatcher } from '~/watcher'

/**
 * 获取用户的 Steam 游戏库信息
 * @param steamId - Steam 用户 ID
 * @returns 格式化后的游戏信息数组
 */
export async function getUserSteamGames(steamId: string): Promise<FormattedGameInfo[]> {
  try {
    // 构建 API URL
    const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/')
    url.searchParams.append('key', import.meta.env.VITE_STEAM_API_KEY)
    url.searchParams.append('steamid', steamId)
    url.searchParams.append('format', 'json')
    url.searchParams.append('include_appinfo', '1')
    url.searchParams.append('include_played_free_games', '1')

    // 发起请求
    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as GetOwnedGamesResponse

    // 检查响应数据
    if (!data.response || !data.response.games) {
      throw new Error('Invalid response format or empty game library')
    }

    // 格式化游戏数据
    return data.response.games.map((game) => ({
      appId: game.appid,
      name: game.name,
      totalPlayingTime: game.playtime_forever * 60 * 1000 // 转换为毫秒
    }))
  } catch (error) {
    console.error('获取 Steam 游戏库失败:', error)
    throw error
  }
}

/**
 * 将用户的 Steam 游戏添加到数据库
 * @param steamId - Steam 用户 ID
 * @returns 添加的游戏数量
 */
/**

 * 将用户的 Steam 游戏添加到数据库

 * @param steamId - Steam 用户 ID

 * @returns 添加的游戏数量

 */

export async function importUserSteamGamesToDatabase(steamId: string): Promise<number> {
  // 获取窗口实例
  const mainWindow = BrowserWindow.getAllWindows()[0]
  stopWatcher()

  try {
    // 获取用户的 Steam 游戏列表
    const games = await getUserSteamGames(steamId)
    const totalGames = games.length

    // 如果没有游戏，直接返回
    if (totalGames === 0) {
      mainWindow.webContents.send('import-steam-games-progress', {
        current: 0,
        total: 0,
        status: 'completed',
        message: '没有找到游戏'
      })
      return 0
    }

    // 发送初始进度
    mainWindow.webContents.send('import-steam-games-progress', {
      current: 0,
      total: totalGames,
      status: 'started',
      message: '开始添加游戏...'
    })

    // 逐个添加游戏到数据库
    for (let i = 0; i < games.length; i++) {
      const game = games[i]
      try {
        await addGameToDatabase({
          dataSource: 'steam',
          id: game.appId.toString(),
          playingTime: game.totalPlayingTime
        })

        // 发送进度更新
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
        // 发送错误信息但继续处理
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

      // 添加小延迟以避免数据库压力
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // 发送完成信息
    mainWindow.webContents.send('import-steam-games-progress', {
      current: totalGames,
      total: totalGames,
      status: 'completed',
      message: '游戏添加完成'
    })

    return totalGames
  } catch (error) {
    // 发送错误信息
    mainWindow.webContents.send('import-steam-games-progress', {
      current: 0,
      total: 0,
      status: 'error',
      message: error instanceof Error ? error.message : '获取游戏列表失败'
    })
    throw error
  } finally {
    await setupWatcher(mainWindow)
  }
}
