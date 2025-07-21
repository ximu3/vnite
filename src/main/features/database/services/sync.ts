import { ConfigDBManager } from '~/core/database'
import { baseDBManager } from '~/core/database'
import { ipcManager } from '~/core/ipc'
import { getCouchDBSize } from '~/utils'
import { ROLE_QUOTAS } from '@appTypes/sync'
import log from 'electron-log/main'

export async function startSync(): Promise<void> {
  try {
    const syncConfig = await ConfigDBManager.getConfigLocalValue('sync')
    const userInfo = await ConfigDBManager.getConfigLocalValue('userInfo')
    if (!syncConfig.enabled) {
      return
    }

    if (syncConfig.mode === 'official') {
      if (
        !syncConfig.officialConfig.auth.username ||
        !syncConfig.officialConfig.auth.password ||
        !userInfo.name ||
        !userInfo.accessToken ||
        !userInfo.role
      ) {
        log.error('Missing official sync username or password')

        ipcManager.send('db:sync-status', {
          status: 'error',
          message: 'Missing official sync username or password',
          timestamp: new Date().toISOString()
        })

        return
      }
      const roleQuotas = ROLE_QUOTAS[userInfo.role]
      const dbSize = await getCouchDBSize(syncConfig.officialConfig.auth.username)
      if (dbSize > roleQuotas.dbSize) {
        log.error('Database size exceeds quota')

        ipcManager.send('db:sync-status', {
          status: 'error',
          message: 'Database size exceeds quota',
          timestamp: new Date().toISOString()
        })

        return
      }
      await baseDBManager.syncAllWithRemote(import.meta.env.VITE_COUCHDB_SERVER_URL, {
        auth: {
          username: syncConfig.officialConfig.auth.username,
          password: syncConfig.officialConfig.auth.password
        },
        isOfficial: true
      })
    } else {
      if (
        !syncConfig.selfHostedConfig.url ||
        !syncConfig.selfHostedConfig.auth.username ||
        !syncConfig.selfHostedConfig.auth.password
      ) {
        log.error('Missing self-hosted sync configuration')

        ipcManager.send('db:sync-status', {
          status: 'error',
          message: 'Missing self-hosted sync configuration',
          timestamp: new Date().toISOString()
        })

        return
      }
      await baseDBManager.syncAllWithRemote(syncConfig.selfHostedConfig.url, {
        auth: {
          username: syncConfig.selfHostedConfig.auth.username,
          password: syncConfig.selfHostedConfig.auth.password
        },
        isOfficial: false
      })
    }

    ipcManager.send('db:sync-status', {
      status: 'success',
      message: 'Sync success',
      timestamp: new Date().toISOString()
    })

    log.info('Sync success')
  } catch (error) {
    log.error('Sync error:', error)

    ipcManager.send('db:sync-status', {
      status: 'error',
      message: 'Sync error',
      timestamp: new Date().toISOString()
    })
  }
}

export async function fullSync(): Promise<void> {
  try {
    const syncConfig = await ConfigDBManager.getConfigLocalValue('sync')
    const userInfo = await ConfigDBManager.getConfigLocalValue('userInfo')
    if (!syncConfig.enabled) {
      return
    }

    ipcManager.send('db:full-syncing')

    if (syncConfig.mode === 'official') {
      if (
        !syncConfig.officialConfig.auth.username ||
        !syncConfig.officialConfig.auth.password ||
        !userInfo.name ||
        !userInfo.accessToken ||
        !userInfo.role
      ) {
        log.error('Missing official sync username or password')

        ipcManager.send('db:sync-status', {
          status: 'error',
          message: 'Missing official sync username or password',
          timestamp: new Date().toISOString()
        })
        ipcManager.send('db:full-sync-error', 'Missing official sync username or password')

        return
      }
      const roleQuotas = ROLE_QUOTAS[userInfo.role]
      const dbSize = await getCouchDBSize(syncConfig.officialConfig.auth.username)
      if (dbSize > roleQuotas.dbSize) {
        log.error('Database size exceeds quota')

        ipcManager.send('db:sync-status', {
          status: 'error',
          message: 'Database size exceeds quota',
          timestamp: new Date().toISOString()
        })
        ipcManager.send('db:full-sync-error', 'Database size exceeds quota')

        return
      }
      await baseDBManager.syncAllWithRemoteFull(import.meta.env.VITE_COUCHDB_SERVER_URL, {
        auth: {
          username: syncConfig.officialConfig.auth.username,
          password: syncConfig.officialConfig.auth.password
        },
        isOfficial: true
      })
    } else {
      if (
        !syncConfig.selfHostedConfig.url ||
        !syncConfig.selfHostedConfig.auth.username ||
        !syncConfig.selfHostedConfig.auth.password
      ) {
        log.error('Missing self-hosted sync configuration')

        ipcManager.send('db:sync-status', {
          status: 'error',
          message: 'Missing self-hosted sync configuration',
          timestamp: new Date().toISOString()
        })
        ipcManager.send('db:full-sync-error', 'Missing self-hosted sync configuration')

        return
      }
      await baseDBManager.syncAllWithRemoteFull(syncConfig.selfHostedConfig.url, {
        auth: {
          username: syncConfig.selfHostedConfig.auth.username,
          password: syncConfig.selfHostedConfig.auth.password
        },
        isOfficial: false
      })
    }

    ipcManager.send('db:sync-status', {
      status: 'success',
      message: 'Sync success',
      timestamp: new Date().toISOString()
    })
    ipcManager.send('db:full-synced')

    log.info('Sync success')
  } catch (error) {
    log.error('Sync error:', error)

    ipcManager.send('db:sync-status', {
      status: 'error',
      message: 'Sync error',
      timestamp: new Date().toISOString()
    })
    ipcManager.send('db:full-sync-error', error instanceof Error ? error.message : String(error))
  }
}

export function stopSync(): void {
  baseDBManager.stopAllSync()
}
