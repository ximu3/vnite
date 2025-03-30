import { ConfigDBManager } from './config'
import { DBManager } from './common'
import { getCouchDbSize } from '~/utils'
import { ROLE_QUOTAS } from '@appTypes/sync'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'

export async function startSync(isStart = false): Promise<void> {
  try {
    const syncConfig = await ConfigDBManager.getConfigLocalValue('sync')
    const userInfo = await ConfigDBManager.getConfigLocalValue('userInfo')
    if (!syncConfig.enabled) {
      return
    }
    const mainWindow = BrowserWindow.getAllWindows()[0]
    setTimeout(
      () => {
        mainWindow.webContents.send('full-syncing')
      },
      isStart ? 0 : 3000
    )
    if (syncConfig.mode === 'official') {
      if (
        !syncConfig.officialConfig.auth.username ||
        !syncConfig.officialConfig.auth.password ||
        !userInfo.name ||
        !userInfo.accessToken ||
        !userInfo.role
      ) {
        log.error('Missing official sync username or password')
        setTimeout(
          () => {
            DBManager.updateSyncStatus({
              status: 'error',
              message: 'Missing official sync username or password',
              timestamp: new Date().toISOString()
            })
          },
          isStart ? 3000 : 0
        )
        return
      }
      const roleQuotas = ROLE_QUOTAS[userInfo.role]
      const dbSize = await getCouchDbSize(syncConfig.officialConfig.auth.username)
      if (dbSize > roleQuotas.dbSize) {
        log.error('Database size exceeds quota')
        setTimeout(
          () => {
            DBManager.updateSyncStatus({
              status: 'error',
              message: 'Database size exceeds quota',
              timestamp: new Date().toISOString()
            })
          },
          isStart ? 3000 : 0
        )
        return
      }
      await DBManager.syncAllWithRemote(import.meta.env.VITE_COUCHDB_SERVER_URL, {
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
        setTimeout(
          () => {
            DBManager.updateSyncStatus({
              status: 'error',
              message: 'Missing self-hosted sync configuration',
              timestamp: new Date().toISOString()
            })
          },
          isStart ? 3000 : 0
        )
        return
      }
      await DBManager.syncAllWithRemote(syncConfig.selfHostedConfig.url, {
        auth: {
          username: syncConfig.selfHostedConfig.auth.username,
          password: syncConfig.selfHostedConfig.auth.password
        }
      })
    }
    setTimeout(
      () => {
        DBManager.updateSyncStatus({
          status: 'success',
          message: 'Sync success',
          timestamp: new Date().toISOString()
        })
        mainWindow.webContents.send('full-synced')
      },
      isStart ? 3500 : 0
    )
    log.info('Sync success')
  } catch (error) {
    log.error('Sync error:', error)
    setTimeout(
      () => {
        DBManager.updateSyncStatus({
          status: 'error',
          message: 'Sync error',
          timestamp: new Date().toISOString()
        })
        const mainWindow = BrowserWindow.getAllWindows()[0]
        mainWindow.webContents.send('full-sync-error', error)
      },
      isStart ? 3500 : 0
    )
  }
}

export function stopSync(): void {
  DBManager.stopAllSync()
}
