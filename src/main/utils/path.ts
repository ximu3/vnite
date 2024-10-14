import { app } from 'electron'
import path from 'path'
import fse from 'fs-extra'

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
 * @param file The path of the file to be attached
 * @returns The path of the file in the database folder
 */
export async function getDataPath(file: string): Promise<string> {
  if (app.isPackaged) {
    const dataPath = path.join(app.getPath('userData'), 'app/database', file)
    await fse.ensureDir(path.dirname(dataPath))
    return dataPath
  } else {
    const dataPath = path.join(getAppRootPath(), '/dev/database', file)
    await fse.ensureDir(path.dirname(dataPath))
    return dataPath
  }
}

/**
 * Get the logs file path
 * @returns The path of the logs file
 */
export function getLogsPath(): string {
  return path.join(getAppRootPath(), '/logs/app.log')
}
