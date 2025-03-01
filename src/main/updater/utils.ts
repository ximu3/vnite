// import fse from 'fs-extra'
// import { getDataPath } from '~/utils'
// import { getDBValue, setDBValue } from '~/database'

// export async function upgradePathJson1to2(gameId: string): Promise<void> {
//   const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')
//   const savePathMode = await getDBValue(`games/${gameId}/path.json`, ['savePath', 'mode'], 'folder')
//   const savePathOld = await getDBValue<string[]>(
//     `games/${gameId}/path.json`,
//     ['savePath', savePathMode],
//     []
//   )

//   const newPathJson: {
//     gamePath: string
//     savePath: string[]
//   } = {
//     gamePath: gamePath,
//     savePath: savePathOld
//   }

//   await setDBValue(`games/${gameId}/path.json`, ['#all'], newPathJson, true, true)
// }

// export async function upgradeAllGamesPathJson1to2(): Promise<void> {
//   // Get all gameIDs (via subdirectories in the games directory)
//   const gamesPath = await getDataPath('games')
//   const gameEntries = await fse.readdir(gamesPath, { withFileTypes: true })
//   const gameIds = gameEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

//   // Parallel processing of all games
//   await Promise.all(
//     gameIds.map(async (gameId) => {
//       try {
//         await upgradePathJson1to2(gameId)
//         console.log(`Successfully upgraded game: ${gameId}`)
//       } catch (error) {
//         console.error(`Failed to upgrade game ${gameId}:`, error)
//       }
//     })
//   )
// }
