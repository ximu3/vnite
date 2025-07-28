import { net } from 'electron'
import log from 'electron-log/main'
import { ConfigDBManager } from '~/core/database'

// Cache interface definition
interface CacheItem {
  size: number
  timestamp: number
}

// In-memory cache object
const sizeCache: Record<string, CacheItem> = {}

// Cache TTL (15 minutes in milliseconds)
const CACHE_TTL = 15 * 60 * 1000

export async function getCouchDBSize(
  username: string,
  refreshCache: boolean = false
): Promise<number> {
  const cacheKey = `couchdb_size_${username}`

  // Check if we have valid cache entry
  const cacheData = sizeCache[cacheKey]
  if (cacheData && Date.now() - cacheData.timestamp < CACHE_TTL && !refreshCache) {
    console.log(`Using cached size for ${username}: ${cacheData.size} bytes`)
    return cacheData.size
  }

  // Cache doesn't exist or has expired, execute original logic
  try {
    const serverUrl = import.meta.env.VITE_COUCHDB_SERVER_URL
    const adminUsername = import.meta.env.VITE_COUCHDB_USERNAME
    const adminPassword = import.meta.env.VITE_COUCHDB_PASSWORD

    if (!serverUrl) {
      throw new Error('Missing CouchDB server URL')
    }

    const dbs = ['game', 'config', 'game-collection', 'plugin']
    let dbSize = 0

    // Query each database and sum up the sizes
    for (const db of dbs) {
      const dbName = `${username}-${db}`.replace('user', 'userdb')
      const url = `${serverUrl}/${dbName}`

      const authHeader = `Basic ${Buffer.from(`${adminUsername}:${adminPassword}`).toString('base64')}`

      const response = await net.fetch(url, {
        headers: {
          Authorization: authHeader
        }
      })

      if (!response.ok) {
        throw new Error(
          `Failed to get size for ${dbName}: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data && data.sizes && data.sizes.file) {
        dbSize += data.sizes.file
      } else {
        throw new Error(`Failed to get size for ${dbName}`)
      }
    }

    // Create new cache item with current timestamp
    sizeCache[cacheKey] = {
      size: dbSize,
      timestamp: Date.now()
    }

    return dbSize
  } catch (error) {
    console.error('Error getting CouchDB size:', error)
    throw error
  }
}

export async function compactRemoteDatabase(username: string): Promise<void> {
  try {
    const syncConfig = await ConfigDBManager.getConfigLocalValue('sync')
    if (!syncConfig.enabled) {
      throw new Error('Sync is not enabled')
    }
    if (syncConfig.mode === 'official') {
      if (!syncConfig.officialConfig.auth.username || !syncConfig.officialConfig.auth.password) {
        throw new Error('Missing official sync username or password')
      }
      const serverUrl = import.meta.env.VITE_COUCHDB_SERVER_URL
      const adminUsername = import.meta.env.VITE_COUCHDB_USERNAME
      const adminPassword = import.meta.env.VITE_COUCHDB_PASSWORD

      if (!serverUrl || !adminUsername || !adminPassword) {
        throw new Error('Missing CouchDB server URL or admin credentials')
      }

      const dbs = ['game', 'config', 'game-collection', 'plugin']

      for (const db of dbs) {
        const dbName = `${username}-${db}`.replace('user', 'userdb')
        const url = `${serverUrl}/${dbName}/_compact`

        const authHeader = `Basic ${Buffer.from(`${adminUsername}:${adminPassword}`).toString('base64')}`

        const response = await net.fetch(url, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(
            `Failed to compact database ${dbName}: ${response.status} ${response.statusText}`
          )
        }

        log.info(`[DB] Database ${dbName} compacted successfully`)
      }
    } else {
      if (
        !syncConfig.selfHostedConfig.url ||
        !syncConfig.selfHostedConfig.auth.username ||
        !syncConfig.selfHostedConfig.auth.password
      ) {
        throw new Error('Missing self-hosted sync configuration')
      }

      const serverUrl = syncConfig.selfHostedConfig.url
      const authUsername = syncConfig.selfHostedConfig.auth.username
      const authPassword = syncConfig.selfHostedConfig.auth.password

      const dbs = ['game', 'config', 'game-collection', 'plugin']

      for (const db of dbs) {
        const dbName = `vnite-${db}`
        const url = `${serverUrl}/${dbName}/_compact`

        const authHeader = `Basic ${Buffer.from(`${authUsername}:${authPassword}`).toString('base64')}`

        const response = await net.fetch(url, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(
            `Failed to compact database ${dbName}: ${response.status} ${response.statusText}`
          )
        }

        log.info(`[DB] Database ${dbName} compacted successfully`)
      }
    }
  } catch (error) {
    log.error('[DB] Error compacting remote database:', error)
    throw error
  }
}
