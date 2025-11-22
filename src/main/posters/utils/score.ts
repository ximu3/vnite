import { GameDBManager } from '~/core/database'

export type ScoreReportData = {
  [L in `level${1 | 2 | 3 | 4 | 5}`]: { gameId: string; score: number }[]
}

export async function getAllGameScore(): Promise<ScoreReportData> {
  const games = await GameDBManager.getAllGames()
  const res: ScoreReportData = { level1: [], level2: [], level3: [], level4: [], level5: [] }
  for (const [gameId, game] of Object.entries(games)) {
    const score = game.record.score
    if (score < 0) continue

    if (score < 6) {
      res.level5.push({ gameId, score })
    } else if (score < 7) {
      res.level4.push({ gameId, score })
    } else if (score < 8) {
      res.level3.push({ gameId, score })
    } else if (score < 9) {
      res.level2.push({ gameId, score })
    } else {
      res.level1.push({ gameId, score })
    }
  }

  Object.values(res).forEach((arr) => arr.sort((a, b) => b.score - a.score))
  return res
}
