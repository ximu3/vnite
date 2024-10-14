import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

type JsonObject = { [key: string]: JsonObject | any }

/**
 * Set the value of a key in a JSON file.
 * @param filePath The path to the JSON file.
 * @param path The path to the key.
 * @param value The value to set.
 * @returns A promise that resolves when the operation is complete.
 */
export async function setValue(filePath: string, path: string[], value: any): Promise<void> {
  const adapter = new JSONFile<JsonObject>(filePath)
  const db = new Low(adapter, {})

  await db.read()

  let current = db.data
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      // 到达最后一个键，设置值
      current[key] = value
    } else {
      // 如果中间的键不存在，创建一个空对象
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
  }

  await db.write()
}

/**
 * Get the value of a key in a JSON file.
 * @param filePath The path to the JSON file.
 * @param path The path to the key.
 * @param defaultValue The default value to set and return if the key does not exist.
 * @returns A promise that resolves with the value of the key.
 */
export async function getValue(filePath: string, path: string[], defaultValue: any): Promise<any> {
  // 创建一个 Low 实例来操作 JSON 文件
  const adapter = new JSONFile<JsonObject>(filePath)
  const db = new Low(adapter, {})

  // 读取当前的数据
  await db.read()

  let current = db.data
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      // 到达最后一个键，设置默认值(如果不存在)
      if (!(key in current)) {
        current[key] = defaultValue
        await db.write()
      }
      return current[key]
    } else {
      // 如果中间的键不存在，创建一个空对象
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
  }

  return defaultValue
}
