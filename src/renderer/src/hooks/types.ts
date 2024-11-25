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
  playedTimes: Number()
}

// 使用 typeof 获取 gameMetadata 的类型
type GameIndexdataKeys = keyof typeof gameIndexdata

// 使用类型别名定义 GameMetadata
export type GameIndexdata = {
  [K in GameIndexdataKeys]?: (typeof gameIndexdata)[K]
}

export const gameIndexdataKeys = Object.keys(gameIndexdata) as (keyof typeof gameIndexdata)[]
