import fse from 'fs-extra'
import { shell } from 'electron'
import path from 'path'
import { getDataPath } from './path'
import { getDBValue } from '~/database'
import { getMedia } from '~/media'
import log from 'electron-log/main.js'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { getAppTempPath } from './path'

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

interface UrlShortcutOptions {
  url: string
  iconPath?: string
  targetPath: string
  name?: string
  description?: string
  categories?: string[]
}

export async function createGameShortcut(gameId: string, targetPath: string): Promise<void> {
  try {
    // 获取游戏信息
    const gameName = await getDBValue(`games/${gameId}/metadata.json`, ['name'], '')

    const originalIconPath = await getMedia(gameId, 'icon')

    // ico图标路径
    const iconPath = await getDataPath(`games/${gameId}/icon.ico`)

    // 转换图标为 ico 格式
    await convertToIcon(originalIconPath, iconPath, {
      sizes: [32],
      quality: 100
    })
    // 创建 URL 快捷方式
    await createUrlShortcut({
      url: `vnite://rungameid/${gameId}`,
      iconPath: iconPath,
      targetPath: targetPath,
      name: gameName,
      description: `Launch ${gameName} in Vnite`,
      categories: ['Game']
    })
  } catch (error) {
    log.error('Error creating game shortcut:', error)
  }
}

/**
 * 创建 URL 快捷方式文件
 * @param options UrlShortcutOptions 配置选项
 */
async function createUrlShortcut(options: UrlShortcutOptions): Promise<string> {
  const { url, iconPath, targetPath, name = 'url_shortcut', description = '' } = options

  try {
    // 确保目标目录存在
    await fse.ensureDir(targetPath)

    const tempName = `${name}_${Date.now()}`
    const tempPath = path.join(targetPath, `${tempName}.url`)
    const finalPath = path.join(targetPath, `${name}.url`)

    await fse.remove(finalPath)

    if (process.platform === 'win32') {
      // Windows URL 快捷方式格式
      const normalizedIconPath = iconPath ? path.resolve(iconPath).split(path.sep).join('\\') : ''

      const content = [
        '[InternetShortcut]',
        `URL=${url}`,
        normalizedIconPath ? `IconFile=${normalizedIconPath}` : '',
        normalizedIconPath ? 'IconIndex=0' : '',
        description ? `Comment=${description}` : '',
        '[{000214A0-0000-0000-C000-000000000046}]',
        'Prop3=19,11'
      ]
        .filter(Boolean)
        .join('\r\n')

      await fse.writeFile(tempPath, content, 'utf-8')
    } else {
      // Linux/macOS .desktop 文件
      const content = [
        '[Desktop Entry]',
        'Version=1.0',
        'Type=Link',
        `Name=${name}`,
        `URL=${url}`,
        iconPath ? `Icon=${iconPath}` : '',
        description ? `Comment=${description}` : '',
        'Categories=Network;'
      ]
        .filter(Boolean)
        .join('\n')

      const desktopPath = path.join(targetPath, `${name}.desktop`)
      await fse.writeFile(desktopPath, content, 'utf-8')
      await fse.chmod(desktopPath, 0o755)
    }

    // 验证文件是否创建成功
    const exists = await fse.pathExists(tempPath)
    if (!exists) {
      throw new Error('Failed to create shortcut file')
    }

    await fse.move(tempPath, finalPath, { overwrite: true })

    return finalPath
  } catch (error) {
    console.error('Error creating URL shortcut:', error)
    throw error
  }
}

interface IconConversionOptions {
  sizes?: number[]
  quality?: number
  background?: sharp.Color
}

/**
 * 将图片转换为 ICO 格式
 * @param inputPath 输入图片路径
 * @param outputPath 输出图片路径
 * @param options 转换选项
 */
async function convertToIcon(
  inputPath: string,
  outputPath: string,
  options: IconConversionOptions = {}
): Promise<string> {
  try {
    const {
      sizes = [32], // Windows 快捷方式通常使用 32x32
      quality = 100,
      background = { r: 0, g: 0, b: 0, alpha: 0 }
    } = options

    // 确保输出目录存在
    await fse.ensureDir(path.dirname(outputPath))

    // 检查输入文件是否存在
    if (!(await fse.pathExists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`)
    }

    // 创建临时 PNG 文件路径
    const tempPngPaths = await Promise.all(
      sizes.map(async (size) => {
        const tempPngPath = getAppTempPath(`icon_${size}.png`)
        await sharp(inputPath)
          .resize(size, size, {
            fit: 'contain',
            background
          })
          .png({ quality })
          .toFile(tempPngPath)
        return tempPngPath
      })
    )

    // 转换 PNG 文件为 ICO 格式
    const icoBuffer = await pngToIco(tempPngPaths)
    await fse.writeFile(outputPath, icoBuffer)

    // 删除临时 PNG 文件
    try {
      await Promise.all(tempPngPaths.map((tempPath) => fse.remove(tempPath)))
    } catch (cleanupError) {
      console.warn('清理临时文件时出错:', cleanupError)
      // 继续执行，因为主要任务已完成
    }

    return outputPath
  } catch (error) {
    console.error('Error converting image:', error)
    throw error
  }
}
