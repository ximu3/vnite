import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

type JsonObject = { [key: string]: JsonObject | any }

class DBManager {
  private static instances: { [key: string]: Low<JsonObject> } = {}
  private static queues: { [key: string]: Promise<any> } = {}
  // Add memory cache
  private static cache: { [key: string]: JsonObject } = {}
  // Add cache status tags
  private static cacheInitialized: { [key: string]: boolean } = {}

  private static getInstance(filePath: string): Low<JsonObject> {
    if (!this.instances[filePath]) {
      const adapter = new JSONFile<JsonObject>(filePath)
      this.instances[filePath] = new Low(adapter, {})
    }
    return this.instances[filePath]
  }

  private static async initializeCache(filePath: string): Promise<void> {
    if (!this.cacheInitialized[filePath]) {
      const db = this.getInstance(filePath)
      await db.read()
      this.cache[filePath] = JSON.parse(JSON.stringify(db.data || {}))
      this.cacheInitialized[filePath] = true
    }
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
      // Make sure the cache is initialized
      await this.initializeCache(filePath)

      const db = this.getInstance(filePath)

      if (path[0] === '#all') {
        db.data = value
        this.cache[filePath] = JSON.parse(JSON.stringify(value))
      } else {
        let current = db.data
        let currentCache = this.cache[filePath]

        for (let i = 0; i < path.length; i++) {
          const key = path[i]
          if (i === path.length - 1) {
            current[key] = value
            currentCache[key] = JSON.parse(JSON.stringify(value))
          } else {
            if (!(key in current)) {
              current[key] = {}
              currentCache[key] = {}
            }
            current = current[key]
            currentCache = currentCache[key]
          }
        }
      }

      await db.write()
    })
  }

  static async getValue<T>(filePath: string, path: string[], defaultValue: T): Promise<T> {
    return this.executeOperation(filePath, async () => {
      // Make sure the cache is initialized
      await this.initializeCache(filePath)

      if (path[0] === '#all') {
        return this.cache[filePath] as T
      }

      let current = this.cache[filePath]
      for (let i = 0; i < path.length; i++) {
        const key = path[i]
        if (i === path.length - 1) {
          if (!(key in current)) {
            // If the value is not in the cache, update the cache and the file
            const db = this.getInstance(filePath)
            current[key] = defaultValue
            db.data = JSON.parse(JSON.stringify(this.cache[filePath]))
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

  // Add a method to clear the cache (which can be called when needed)
  static clearCache(filePath?: string): void {
    if (filePath) {
      delete this.cache[filePath]
      delete this.cacheInitialized[filePath]
    } else {
      this.cache = {}
      this.cacheInitialized = {}
    }
  }
}

export const setValue = DBManager.setValue.bind(DBManager)
export const getValue = DBManager.getValue.bind(DBManager)
export const clearCache = DBManager.clearCache.bind(DBManager)
