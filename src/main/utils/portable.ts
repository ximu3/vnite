import fse from 'fs-extra'
import { getDataPathSync, getAppRootPath } from './path'
import path from 'path'
import log from 'electron-log/main.js'
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
    const basePath = getDataPathSync('')
    const portablePath = path.join(getAppRootPath(), 'portable/app/database')
    await fse.ensureDir(portablePath)
    await fse.emptyDir(portablePath)
    await fse.copy(basePath, portablePath)
    await fse.remove(basePath)
    log.info('已切换到便携模式')
  } catch (error) {
    log.error('切换到便携模式失败', error)
    throw error
  }
}

export async function switch2NormalMode(): Promise<void> {
  try {
    const basePath = path.join(app.getPath('userData'), 'app/database')
    const portablePath = path.join(getAppRootPath(), 'portable/app/database')
    await fse.ensureDir(basePath)
    await fse.emptyDir(basePath)
    await fse.copy(portablePath, basePath)
    await fse.remove(path.join(getAppRootPath(), 'portable'))
    log.info('已切换到正常模式')
  } catch (error) {
    log.error('切换到正常模式失败', error)
    throw error
  }
}

export async function checkPortableMode(): Promise<void> {
  try {
    const portablePath = path.join(getAppRootPath(), 'portable')
    portableStore.isPortableMode = await fse.pathExists(portablePath)
  } catch (error) {
    log.error('检查便携模式失败', error)
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
    log.error('切换数据库模式失败', error)
    throw error
  }
}
