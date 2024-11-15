import { getDBValue } from './services'
import { getDataPath } from '~/utils'
import fse from 'fs-extra'

// 遍历datapath/games下的所有文件夹下的metadata.json文件，以{gameId: metadata}的形式返回,gameId为文件夹名,使用getDBValue
export async function getMetadata(): Promise<Record<string, any>> {
  const gamesPath = await getDataPath('games')

  // 读取目录内容并过滤出子目录
  const gameFolders = await fse
    .readdir(gamesPath, { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))

  const metadata = await Promise.all(
    gameFolders.map(async (gameId) => {
      const data = await getDBValue(`games/${gameId}/metadata.json`, ['#all'], {})
      const addDate = await getDBValue(`games/${gameId}/record.json`, ['addDate'], {})
      const lastRunDate = await getDBValue(`games/${gameId}/record.json`, ['lastRunDate'], '')

      return {
        ...data,
        addDate,
        lastRunDate
      }
    })
  )

  return Object.fromEntries(gameFolders.map((gameId, index) => [gameId, metadata[index]]))
}
