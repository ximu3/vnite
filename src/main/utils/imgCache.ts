interface CacheEntry {
  data: Buffer | null // null means the image does not exist
  timestamp: string
  lastAccessed: number
}

interface CacheMap {
  [key: string]: CacheEntry
}

export class MemoryImageCache {
  private cache: CacheMap = {}
  private maxSize: number = 50 * 1024 * 1024 // 50MB
  private currentSize: number = 0

  set(key: string, data: Buffer | null, timestamp: string): void {
    // If the image is marked as non-existent (data is null), it will not be counted in the memory size.
    const size = data?.length || 0

    if (data && size > this.maxSize) {
      return
    }

    // If it already exists in the cache, remove the old entry first.
    if (this.cache[key]) {
      const oldSize = this.cache[key].data?.length || 0
      this.currentSize -= oldSize
    }

    // Making room for new data
    while (data && this.currentSize + size > this.maxSize) {
      this.removeOldest()
    }

    this.cache[key] = {
      data,
      timestamp,
      lastAccessed: Date.now()
    }

    if (data) {
      this.currentSize += size
    }
  }

  get(key: string, timestamp: string): Buffer | null | undefined {
    const entry = this.cache[key]
    if (entry && entry.timestamp === timestamp) {
      entry.lastAccessed = Date.now()
      return entry.data // May be Buffer or null
    }
    return undefined // Indicates not cached
  }

  private removeOldest(): void {
    let oldestKey: string | null = null
    let oldestAccess = Date.now()

    for (const [key, entry] of Object.entries(this.cache)) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      const oldSize = this.cache[oldestKey].data?.length || 0
      this.currentSize -= oldSize
      delete this.cache[oldestKey]
    }
  }
}
