import { getSteamGridDBAssets } from './common'
import log from 'electron-log/main.js'

export async function getIconFromSteamGridDB(identifier: string | number): Promise<string> {
  try {
    const assets = await getSteamGridDBAssets(identifier)
    if (assets) {
      return assets.icon
    }
  } catch (error) {
    log.error(`获取 SteamGridDB 图标时出错: ${error}`)
  }
  return ''
}

export async function getHeroFromSteamGridDB(identifier: string | number): Promise<string> {
  try {
    const assets = await getSteamGridDBAssets(identifier)
    if (assets) {
      return assets.hero
    }
  } catch (error) {
    log.error(`获取 SteamGridDB Hero 时出错: ${error}`)
  }
  return ''
}

export async function getLogoFromSteamGridDB(identifier: string | number): Promise<string> {
  try {
    const assets = await getSteamGridDBAssets(identifier)
    if (assets) {
      return assets.logo
    }
  } catch (error) {
    log.error(`获取 SteamGridDB Logo 时出错: ${error}`)
  }
  return ''
}
