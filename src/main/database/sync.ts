import { ConfigDBManager } from './config'
import { DBManager } from './common'

export async function startSync(): Promise<void> {
  try {
    const syncConfig = await ConfigDBManager.getConfigLocalValue('sync')
    if (!syncConfig.enabled) {
      return
    }
    if (syncConfig.mode === 'official') {
      if (!syncConfig.officialConfig.auth.username || !syncConfig.officialConfig.auth.password) {
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
      await DBManager.syncAllWithRemote('http://localhost:5984', {
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
