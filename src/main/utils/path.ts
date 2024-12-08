import { app } from 'electron'
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

/**
 * Get the file in database folder
 * Automatically create the parent directory if it does not exist
 * @param file The path of the file to be attached
 * @returns The path of the file in the database folder
 */
export async function getDataPath(file: string, forceCreate?: boolean): Promise<string> {
  try {
    // Determine if it is a packaged environment
    const basePath = app.isPackaged
      ? path.join(app.getPath('userData'), 'app/database')
      : path.join(getAppRootPath(), '/dev/database')

    const fullPath = path.join(basePath, file)

    // Checks if the games/{gameid} pattern is included.
    if (!forceCreate) {
      const regex = /games\/([^/]+)/
      const match = file.match(regex)

      if (match) {
        // Get the full path to games/{gameid}.
        const gamesFolderPath = path.join(basePath, 'games', match[1])

        // Check if the game directory exists
        const exists = await fse.pathExists(gamesFolderPath)
        if (!exists) {
          throw new Error(`Game directory not found: ${match[1]}`)
        }
      }
    }

    // Determine if it is a file path (check for extension)
    const isFile = path.extname(file) !== ''

    if (isFile) {
      // If it's a file path, make sure the parent directory exists
      const dirPath = path.dirname(fullPath)
      await fse.ensureDir(dirPath)
    } else {
      // If it is a folder path, it is straightforward to ensure that the directory exists
      await fse.ensureDir(fullPath)
    }

    return fullPath
  } catch (error) {
    console.error('Failed to get data path', error)
    throw error
  }
}

/**
 * Get the logs file path
 * @returns The path of the logs file
 */
export function getLogsPath(): string {
  return path.join(getAppRootPath(), '/logs/app.log')
}

/**
 * Get the path to the application log file
 * @param subDir The subdirectory to use
 * @returns The path to the application log file
 */
export function getAppTempPath(subDir?: string): string {
  // Use electron's app.getPath('temp') to get the system temp directory.
  // If the app is not accessible in the main process, use os.tmpdir()
  const tempDir = app?.getPath?.('temp') || os.tmpdir()

  // Creating application-specific temporary directory paths
  const appTempDir = path.join(tempDir, 'vnite', subDir || '')

  return appTempDir
}

/**
 * Set up the temporary directory for the application
 * @returns The path of the temporary directory
 */
export async function setupTempDirectory(): Promise<string> {
  try {
    const fs = require('fs-extra')
    const tempPath = getAppTempPath()

    // Ensure that the temporary directory exists
    await fs.ensureDir(tempPath)

    // Clean up the temporary directory when the app exits
    app.on('quit', async () => {
      try {
        await fs.remove(tempPath)
        console.log('临时目录已清理')
      } catch (error) {
        console.error('清理临时目录失败:', error)
      }
    })

    console.log('临时目录已设置:', tempPath)
    return tempPath
  } catch (error) {
    console.error('设置临时目录失败:', error)
    throw error
  }
}
