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
 * @param file The path of the file to be attached
 * @returns The path of the file in the database folder
 */
export async function getDataPath(file: string, forceCreate?: boolean): Promise<string> {
  try {
    // 判断是否为打包环境
    const basePath = app.isPackaged
      ? path.join(app.getPath('userData'), 'app/database')
      : path.join(getAppRootPath(), '/dev/database')

    const fullPath = path.join(basePath, file)

    // 检查是否包含 games/{gameid} 模式

    if (!forceCreate) {
      const regex = /games\/([^/]+)/
      const match = file.match(regex)

      if (match) {
        // 获取到 games/{gameid} 的完整路径
        const gamesFolderPath = path.join(basePath, 'games', match[1])

        // 检查游戏目录是否存在
        const exists = await fse.pathExists(gamesFolderPath)
        if (!exists) {
          throw new Error(`Game directory not found: ${match[1]}`)
        }
      }
    }

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

/**
 * 获取应用程序临时目录
 * @param subDir 子目录名称（可选）
 * @returns 临时目录路径
 */
export function getAppTempPath(subDir?: string): string {
  // 使用 electron 的 app.getPath('temp') 获取系统临时目录
  // 如果在主进程中无法访问 app，则使用 os.tmpdir()
  const tempDir = app?.getPath?.('temp') || os.tmpdir()

  // 创建应用特定的临时目录路径
  const appTempDir = path.join(
    tempDir,
    'vnite', // 替换为你的应用名称
    subDir || ''
  )

  return appTempDir
}

/**
 * 设置和初始化应用程序临时目录
 */
export async function setupTempDirectory(): Promise<string> {
  try {
    const fs = require('fs-extra')
    const tempPath = getAppTempPath()

    // 确保临时目录存在
    await fs.ensureDir(tempPath)

    // 可选：在应用退出时清理临时目录
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
