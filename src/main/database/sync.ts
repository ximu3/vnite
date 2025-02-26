import { ConfigDBManager } from './config'
import { DBManager } from './common'

export async function startSync(): Promise<void> {
  const syncConfig = await ConfigDBManager.getConfigLocalValue('sync')
  if (!syncConfig.enabled) {
    return
  }
  if (syncConfig.mode === 'offical') {
    await DBManager.syncAllWithRemote('http://localhost:5984', {
      auth: {
        username: syncConfig.officalConfig.auth.username,
        password: syncConfig.officalConfig.auth.password
      }
    })
  } else {
    await DBManager.syncAllWithRemote(syncConfig.selfHostedConfig.url, {
      auth: {
        username: syncConfig.selfHostedConfig.auth.username,
        password: syncConfig.selfHostedConfig.auth.password
      }
    })
  }
}

export function stopSync(): void {
  DBManager.stopAllSync()
}
