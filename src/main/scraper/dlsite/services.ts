import {
  searchDlsiteGames,
  getDlsiteMetadata,
  getGameScreenshots,
  getGameCover,
  checkGameExists,
  getGameCoverByTitle,
  getGameScreenshotsByTitle
} from './common'

import { GameList, GameMetadata } from '@appTypes/utils'
import log from 'electron-log/main.js'

/**
 * 在 DLsite 上搜索作品
 * @param gameName 要搜索的作品名称
 * @returns 作品列表
 * @throws 如果操作失败则抛出错误
 */
export async function searchGamesFromDLsite(gameName: string): Promise<GameList> {
  try {
    const games = await searchDlsiteGames(gameName)
    return games
  } catch (error) {
    log.error('搜索作品时出错:', error)
    throw error
  }
}

/**
 * 从 DLsite 获取作品元数据
 * @param dlsiteId DLsite 上的作品 ID (RJ号)
 * @returns 作品的元数据
 * @throws 如果操作失败则抛出错误
 */
export async function getGameMetadataFromDLsite(dlsiteId: string): Promise<GameMetadata> {
  try {
    const metadata = await getDlsiteMetadata(dlsiteId)
    return metadata
  } catch (error) {
    log.error('获取作品元数据时出错:', error)
    throw error
  }
}

/**
 * 检查作品是否存在于 DLsite
 * @param dlsiteId DLsite 上的作品 ID (RJ号)
 * @returns 表示作品是否存在的布尔值
 * @throws 如果操作失败则抛出错误
 */
export async function checkGameExistsOnDLsite(dlsiteId: string): Promise<boolean> {
  try {
    const exists = await checkGameExists(dlsiteId)
    return exists
  } catch (error) {
    log.error('检查作品是否存在时出错:', error)
    throw error
  }
}

/**
 * 从 DLsite 获取作品截图
 * @param dlsiteId DLsite 上的作品 ID (RJ号)
 * @returns 截图列表
 * @throws 如果操作失败则抛出错误
 */
export async function getGameScreenshotsFromDLsite(dlsiteId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(dlsiteId)
    return images
  } catch (error) {
    log.error('获取作品截图时出错:', error)
    throw error
  }
}

/**
 * 从 DLsite 获取作品封面
 * @param dlsiteId DLsite 上的作品 ID (RJ号)
 * @returns 作品的封面图片
 * @throws 如果操作失败则抛出错误
 */
export async function getGameCoverFromDLsite(dlsiteId: string): Promise<string> {
  try {
    const cover = await getGameCover(dlsiteId)
    return cover
  } catch (error) {
    log.error('获取作品封面时出错:', error)
    throw error
  }
}

/**
 * 通过标题从 DLsite 获取作品封面
 * @param gameName 作品名称
 * @returns 作品的封面图片
 * @throws 如果操作失败则抛出错误
 */
export async function getGameCoverByTitleFromDLsite(gameName: string): Promise<string> {
  try {
    const cover = await getGameCoverByTitle(gameName)
    return cover
  } catch (error) {
    log.error('通过标题获取作品封面时出错:', error)
    throw error
  }
}

/**
 * 通过标题从 DLsite 获取作品截图
 * @param gameName 作品名称
 * @returns 截图列表
 * @throws 如果操作失败则抛出错误
 */
export async function getGameScreenshotsByTitleFromDLsite(gameName: string): Promise<string[]> {
  try {
    const images = await getGameScreenshotsByTitle(gameName)
    return images
  } catch (error) {
    log.error('通过标题获取作品截图时出错:', error)
    throw error
  }
}
