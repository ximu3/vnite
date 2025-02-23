import { ConfigDBManager } from './config'
import { DBManager } from './common'

const EXCLUDE_PATHS = {
  game: [
    {
      docId: '#all',
      path: ['path']
    }
  ],
  config: [
    {
      docId: 'sync',
      path: ['#all']
    }
  ]
}

export async function startSync(): Promise<void> {
  const syncConfig = await ConfigDBManager.getSyncConfig()
  if (!syncConfig.enabled) {
    return
  }
  if (syncConfig.mode === 'offical') {
    await DBManager.syncAllWithRemote('http://localhost:5984', {
      auth: {
        username: syncConfig.officalConfig.auth.username,
        password: syncConfig.officalConfig.auth.password
      },
      excludePaths: EXCLUDE_PATHS
    })
  } else {
    await DBManager.syncAllWithRemote(syncConfig.selfHostedConfig.url, {
      auth: {
        username: syncConfig.selfHostedConfig.auth.username,
        password: syncConfig.selfHostedConfig.auth.password
      },
      excludePaths: EXCLUDE_PATHS
    })
  }
}

export function stopSync(): void {
  DBManager.stopAllSync()
}
