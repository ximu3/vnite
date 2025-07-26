import { app } from 'electron'
import { portableStore } from './portable'
import path from 'path'
import fse from 'fs-extra'
import os from 'os'
import log from 'electron-log/main'

export function getAppRootPath(): string {
  try {
    if (app.isPackaged) {
      return path.dirname(app.getPath('exe'))
    } else {
      return app.getAppPath()
    }
  } catch (error) {
    log.error('[System] Failed to get app root path:', error)
    throw error
  }
}

export function getDataPath(file = ''): string {
  try {
    const basePath = portableStore.isPortableMode
      ? path.join(getAppRootPath(), 'app/database')
      : path.join(app.getPath('userData'), 'app/database')

    return path.join(basePath, file)
  } catch (error) {
    log.error('[System] Failed to get data path:', error)
    throw error
  }
}

export function getLogsPath(): string {
  try {
    const basePath = portableStore.isPortableMode
      ? path.join(getAppRootPath(), 'logs')
      : app.getPath('logs')
    return path.join(basePath, 'app.log')
  } catch (error) {
    log.error('[System] Failed to get logs path:', error)
    throw error
  }
}

}

export function getAppTempPath(file?: string): string {
  try {
    // Use electron's app.getPath('temp') to get the system temp directory.
    // If the app is not accessible in the main process, use os.tmpdir()
    const tempDir = app?.getPath?.('temp') || os.tmpdir()

    // Creating application-specific temporary directory paths
    const appTempDir = path.join(tempDir, 'vnite', file || '')

    return appTempDir
  } catch (error) {
    log.error('[System] Failed to get app temp path:', error)
    throw error
  }
}

export async function setupTempDirectory(): Promise<string> {
  try {
    const tempPath = getAppTempPath()

    // Ensure that the temporary directory exists
    await fse.ensureDir(tempPath)

    // Clean up the temporary directory when the app exits
    app.on('quit', async () => {
      try {
        await fse.remove(tempPath)
        log.info('[System] Temporary directory cleared')
      } catch (error) {
        log.error('[System] Failed to clean up temporary directory:', error)
      }
    })

    log.info('[System] Temporary directory is set:', tempPath)
    return tempPath
  } catch (error) {
    log.error('[System] Failed to set up temporary directory:', error)
    throw error
  }
}
