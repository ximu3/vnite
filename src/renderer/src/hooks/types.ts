// 定义 gameIndexdata 对象作为类型推断的基础
const gameIndexdata = {
  id: String(),
  name: String(),
  releaseDate: String(),
  developers: [] as string[],
  category: String(),
  publishers: [] as string[],
  genres: [] as string[],
  tags: [] as string[],
  addDate: String(),
  lastRunDate: String(),
  score: Number(),
  playingTime: Number(),
  playedTimes: Number(),
  playStatus: String()
}

// Getting the type of gameMetadata using typeof
type GameIndexdataKeys = keyof typeof gameIndexdata

// Defining GameMetadata with Type Aliases
export type GameIndexdata = {
  [K in GameIndexdataKeys]?: (typeof gameIndexdata)[K]
}

export const gameIndexdataKeys = Object.keys(gameIndexdata) as (keyof typeof gameIndexdata)[]
