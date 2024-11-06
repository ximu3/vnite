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
  try {
    // 判断是否为打包环境
    const basePath = app.isPackaged
      ? path.join(app.getPath('userData'), 'app/database')
      : path.join(getAppRootPath(), '/dev/database')

    const fullPath = path.join(basePath, file)

    // 判断是否为文件路径（检查是否有扩展名）
    const isFile = path.extname(file) !== ''

    if (isFile) {
      // 如果是文件路径，确保父目录存在
      const dirPath = path.dirname(fullPath)
      await fse.ensureDir(dirPath)
    } else {
      // 如果是文件夹路径，直接确保该目录存在
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
