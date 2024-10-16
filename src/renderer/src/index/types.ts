// 定义 gameMetadata 对象
const gameIndexdata = {
  developer: 'developer',
  category: 'category'
  // 其他可能的字段
}

// 使用 typeof 获取 gameMetadata 的类型
type GameIndexdataKeys = keyof typeof gameIndexdata

// 使用类型别名定义 GameMetadata
export type GameIndexdata = {
  [K in GameIndexdataKeys]?: string
}

export const gameIndexdataKeys = Object.keys(gameIndexdata) as (keyof typeof gameIndexdata)[]
