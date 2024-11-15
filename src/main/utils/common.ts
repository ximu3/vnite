import fse from 'fs-extra'
import { shell } from 'electron'
import path from 'path'
import { getDataPath } from './path'

export async function openPathInExplorer(filePath: string): Promise<void> {
  try {
    // 检查路径是否存在
    const stats = await fse.stat(filePath)

    // 如果是文件，获取其目录路径
    const dirPath = stats.isFile() ? path.dirname(filePath) : filePath

    // 使用Electron的shell模块打开路径
    shell.openPath(dirPath)
  } catch (error) {
    console.error('Error opening path:', error)
  }
}

export async function openGameDBPathInExplorer(gameId: string): Promise<void> {
  const gameDBPath = await getDataPath(`games/${gameId}/`)
  if (gameDBPath) {
    await openPathInExplorer(gameDBPath)
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return ''
    }

    // 格式化为 YYYY-MM-DD
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/**
 * 获取指定目录下的所有一级子文件夹名称
 * @param dirPath 目录路径
 * @returns Promise<string[]> 子文件夹名称数组
 */
export async function getFirstLevelSubfolders(dirPath: string): Promise<string[]> {
  // 确保目录存在
  if (!(await fse.pathExists(dirPath))) {
    throw new Error('目录不存在')
  }

  // 读取目录内容
  const items = await fse.readdir(dirPath)

  // 过滤出文件夹
  const subfolders = await Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dirPath, item)
      const stats = await fse.stat(fullPath)
      return {
        name: item,
        isDirectory: stats.isDirectory()
      }
    })
  )

  // 返回文件夹名称数组
  return subfolders.filter((item) => item.isDirectory).map((item) => item.name)
}
