import fse from 'fs-extra'
import { getDataPath, getAppRootPath } from './path'
import { baseDBManager } from '~/core/database'
import path from 'path'
import log from 'electron-log/main'
import { app } from 'electron'

let _isPortableMode: boolean = false

export const portableStore = {
  get isPortableMode(): boolean {
    return _isPortableMode
  },
  set isPortableMode(isPortable: boolean) {
    _isPortableMode = isPortable
  }
}

export async function switch2PortableMode(): Promise<void> {
  try {
    const basePath = getDataPath('')
    const portablePath = path.join(getAppRootPath(), 'app/database')
    await baseDBManager.closeAllDatabases()
    await fse.ensureDir(portablePath)
    await fse.emptyDir(portablePath)
    await fse.copy(basePath, portablePath)
    await fse.remove(basePath)
    log.info('[System] Switched to portable mode')
  } catch (error) {
    log.error('[System] Failed to switch to portable mode', error)
    throw error
  }
}

export async function switch2NormalMode(): Promise<void> {
  try {
    const basePath = path.join(app.getPath('userData'), 'app/database')
    const portablePath = path.join(getAppRootPath(), 'app/database')
    await baseDBManager.closeAllDatabases()
    await fse.ensureDir(basePath)
    await fse.emptyDir(basePath)
    await fse.copy(portablePath, basePath)
    await fse.remove(path.join(getAppRootPath(), 'app'))
    log.info('[System] Switched to normal mode')
  } catch (error) {
    log.error('[System] Failed to switch to normal mode', error)
    throw error
  }
}

export async function checkPortableMode(): Promise<void> {
  try {
    const portablePath = path.join(getAppRootPath(), 'app')
    portableStore.isPortableMode = await fse.pathExists(portablePath)
  } catch (error) {
    log.error('[System] Failed to check portable mode', error)
    throw error
  }
}

export async function switchDatabaseMode(): Promise<void> {
  try {
    if (portableStore.isPortableMode) {
      await switch2NormalMode()
    } else {
      await switch2PortableMode()
    }
    portableStore.isPortableMode = !portableStore.isPortableMode
  } catch (error) {
    log.error('[System] Failed to switch database schema', error)
    throw error
  }
}
