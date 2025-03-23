import { app } from 'electron'
import { portableStore } from './portable'
import path from 'path'
import fse from 'fs-extra'
import os from 'os'

/**
 * Get the path of the root directory of the application
 * @returns The path of the root directory of the application
 */
export function getAppRootPath(): string {
  if (app.isPackaged) {
    return path.dirname(app.getPath('exe'))
  } else {
    return app.getAppPath()
  }
}

export function getDataPath(file = ''): string {
  const basePath = portableStore.isPortableMode
    ? path.join(getAppRootPath(), 'app/database')
    : path.join(app.getPath('userData'), 'app/database')

  return path.join(basePath, file)
}

/**
 * Get the logs file path
 * @returns The path of the logs file
 */
export function getLogsPath(): string {
  const basePath = portableStore.isPortableMode
    ? path.join(getAppRootPath(), 'logs')
    : app.getPath('logs')
  return path.join(basePath, 'app.log')
}

/**
 * Get the path to the application log file
 * @param subDir The subdirectory to use
 * @returns The path to the application log file
 */
export function getAppTempPath(file?: string): string {
  // Use electron's app.getPath('temp') to get the system temp directory.
  // If the app is not accessible in the main process, use os.tmpdir()
  const tempDir = app?.getPath?.('temp') || os.tmpdir()

  // Creating application-specific temporary directory paths
  const appTempDir = path.join(tempDir, 'vnite', file || '')

  return appTempDir
}

/**
 * Set up the temporary directory for the application
 * @returns The path of the temporary directory
 */
export async function setupTempDirectory(): Promise<string> {
  try {
    const tempPath = getAppTempPath()

    // Ensure that the temporary directory exists
    await fse.ensureDir(tempPath)

    // Clean up the temporary directory when the app exits
    app.on('quit', async () => {
      try {
        await fse.remove(tempPath)
        console.log('Temporary directory cleared')
      } catch (error) {
        console.error('Failed to clean up temporary directory:', error)
      }
    })

    console.log('Temporary directory is set:', tempPath)
    return tempPath
  } catch (error) {
    console.error('Failed to set up temporary directory:', error)
    throw error
  }
}
