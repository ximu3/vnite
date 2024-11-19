import { getValue } from './common'
import { getDataPath } from '~/utils'
import fse from 'fs-extra'

// 遍历datapath/games下的所有文件夹下的record.json文件，以{gameId: record}的形式返回,gameId为文件夹名,使用getDBValue
export async function getRecordData(): Promise<Record<string, any>> {
  const gamesPath = await getDataPath('games')

  // 读取目录内容并过滤出子目录
  const gameFolders = await fse
    .readdir(gamesPath, { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))

  const record = await Promise.all(
    gameFolders.map(async (gameId) => {
      const dbPath = await getDataPath(`games/${gameId}/record.json`)
      return await getValue(dbPath, ['#all'], [])
    })
  )

  return Object.fromEntries(gameFolders.map((gameId, index) => [gameId, record[index]]))
}
