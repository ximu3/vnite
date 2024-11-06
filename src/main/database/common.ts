import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

type JsonObject = { [key: string]: JsonObject | any }

class DBManager {
  private static instances: { [key: string]: Low<JsonObject> } = {}
  private static queues: { [key: string]: Promise<any> } = {}

  private static getInstance(filePath: string): Low<JsonObject> {
    if (!this.instances[filePath]) {
      const adapter = new JSONFile<JsonObject>(filePath)
      this.instances[filePath] = new Low(adapter, {})
    }
    return this.instances[filePath]
  }

  private static async executeOperation<T>(
    filePath: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.queues[filePath]) {
      this.queues[filePath] = Promise.resolve()
    }

    return (this.queues[filePath] = this.queues[filePath].then(operation).catch((error) => {
      console.error('Error executing operation:', error)
      throw error
    }))
  }

  static async setValue(filePath: string, path: string[], value: any): Promise<void> {
    return this.executeOperation(filePath, async () => {
      const db = this.getInstance(filePath)
      await db.read()

      if (path[0] === '#all') {
        db.data = value
      } else {
        let current = db.data
        for (let i = 0; i < path.length; i++) {
          const key = path[i]
          if (i === path.length - 1) {
            current[key] = value
          } else {
            if (!(key in current)) {
              current[key] = {}
            }
            current = current[key]
          }
        }
      }

      await db.write()
    })
  }

  static async getValue<T>(filePath: string, path: string[], defaultValue: T): Promise<T> {
    return this.executeOperation(filePath, async () => {
      const db = this.getInstance(filePath)
      await db.read()

      if (path[0] === '#all') {
        return db.data as T
      }

      let current = db.data
      for (let i = 0; i < path.length; i++) {
        const key = path[i]
        if (i === path.length - 1) {
          if (!(key in current)) {
            current[key] = defaultValue
            await db.write()
          }
          return current[key] as T
        } else {
          if (!(key in current)) {
            current[key] = {}
          }
          current = current[key]
        }
      }

      return defaultValue
    })
  }
}

export const setValue = DBManager.setValue.bind(DBManager)
export const getValue = DBManager.getValue.bind(DBManager)
