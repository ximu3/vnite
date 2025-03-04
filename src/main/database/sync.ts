import { ConfigDBManager } from './config'
import { DBManager } from './common'
import { calculateDBSize } from '~/utils'
import { ROLE_QUOTAS } from '@appTypes/sync'

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
        !userInfo.id ||
        !userInfo.accessToken ||
        !userInfo.role
      ) {
        console.error('Missing official sync username or password')
        setTimeout(() => {
          DBManager.updateSyncStatus({
            status: 'error',
            message: 'Missing official sync username or password',
            timestamp: new Date().toISOString()
          })
        }, 17000)
        return
      }
      const roleQuotas = ROLE_QUOTAS[userInfo.role]
      const dbSize = await calculateDBSize()
      if (dbSize > roleQuotas.dbSize) {
        console.error('Database size exceeds quota')
        setTimeout(() => {
          DBManager.updateSyncStatus({
            status: 'error',
            message: 'Database size exceeds quota',
            timestamp: new Date().toISOString()
          })
        }, 17000)
        return
      }
      await DBManager.syncAllWithRemote(import.meta.env.VITE_COUCHDB_SERVER_URL, {
        auth: {
          username: syncConfig.officialConfig.auth.username,
          password: syncConfig.officialConfig.auth.password
        }
      })
    } else {
      if (
        !syncConfig.selfHostedConfig.url ||
        !syncConfig.selfHostedConfig.auth.username ||
        !syncConfig.selfHostedConfig.auth.password
      ) {
        console.error('Missing self-hosted sync configuration')
        setTimeout(() => {
          DBManager.updateSyncStatus({
            status: 'error',
            message: 'Missing self-hosted sync configuration',
            timestamp: new Date().toISOString()
          })
        }, 17000)
        return
      }
      await DBManager.syncAllWithRemote(syncConfig.selfHostedConfig.url, {
        auth: {
          username: syncConfig.selfHostedConfig.auth.username,
          password: syncConfig.selfHostedConfig.auth.password
        }
      })
    }
    setTimeout(() => {
      DBManager.updateSyncStatus({
        status: 'success',
        message: '同步成功',
        timestamp: new Date().toISOString()
      })
    }, 17000)
    console.log('Sync success')
  } catch (error) {
    console.error('Sync error:', error)
    setTimeout(() => {
      DBManager.updateSyncStatus({
        status: 'error',
        message: '同步失败',
        timestamp: new Date().toISOString()
      })
    }, 17000)
  }
}

export function stopSync(): void {
  DBManager.stopAllSync()
}
