import fse from 'fs-extra'
import { shell, app } from 'electron'
import path from 'path'
import { getDataPath } from './path'
import { getDBValue } from '~/database'
import { getMedia } from '~/media'
import log from 'electron-log/main.js'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { getAppTempPath } from './path'

/**
 * Parse the game ID from a URL
 * @param url The URL
 * @returns The game ID or null if not found
 */
export function parseGameIdFromUrl(url: string): string | null {
  const match = url.match(/vnite:\/\/rungameid\/([^/\s]+)/)
  return match ? match[1] : null
}

/**
 * Get the version of the application
 * @returns The version of the application
 */
export function getAppVersion(): string {
  return app.getVersion()
}

/**
 * Get the path to the application log file
 * @returns The path to the application log file
 */
export async function setupOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await getDBValue('config.json', ['general', 'openAtLogin'], false)
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('Error toggling open at login:', error)
  }
}

/**
 * Open a path in the file explorer
 * @param filePath The path to open
 */
export async function updateOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await getDBValue('config.json', ['general', 'openAtLogin'], false)
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('Error setting open at login:', error)
  }
}

/**
 * Open a path in the file explorer
 * @param filePath The path to open
 */
export async function openPathInExplorer(filePath: string): Promise<void> {
  try {
    // Check if the path exists
    const stats = await fse.stat(filePath)

    // If it's a file, get its directory path
    const dirPath = stats.isFile() ? path.dirname(filePath) : filePath

    // Open the path using Electron's shell module
    shell.openPath(dirPath)
  } catch (error) {
    console.error('Error opening path:', error)
  }
}

/**
 * Open the game database path in the file explorer
 * @param gameId The ID of the game
 */
export async function openGameDBPathInExplorer(gameId: string): Promise<void> {
  const gameDBPath = await getDataPath(`games/${gameId}/`)
  if (gameDBPath) {
    await openPathInExplorer(gameDBPath)
  }
}

export async function openDatabasePathInExplorer(): Promise<void> {
  const databasePath = await getDataPath('')
  if (databasePath) {
    await openPathInExplorer(databasePath)
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Format a date string as YYYY-MM-DD
 * @param dateString The date string
 * @returns The formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return ''
    }

    // Formatted as YYYY-MM-DD
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/**
 * Get the names of all first-level subfolders in the specified directory.
 * @param dirPath Directory Path
 * @returns Promise<string[]> Array of subfolder names
 */
export async function getFirstLevelSubfolders(dirPath: string): Promise<string[]> {
  // Make sure the catalog exists
  if (!(await fse.pathExists(dirPath))) {
    throw new Error('目录不存在')
  }

  // Read the contents of the catalog
  const items = await fse.readdir(dirPath)

  // Filter out folders
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

  // Returns an array of folder names
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

/**
 * Create a shortcut for a game
 * @param gameId The ID of the game
 * @param targetPath The path to save the shortcut
 */
export async function createGameShortcut(gameId: string, targetPath: string): Promise<void> {
  try {
    // Get game information
    const gameName = await getDBValue(`games/${gameId}/metadata.json`, ['name'], '')

    const originalIconPath = await getMedia(gameId, 'icon')

    // ico icon path
    const iconPath = await getDataPath(`games/${gameId}/icon.ico`)

    // Convert icons to ico format
    await convertToIcon(originalIconPath, iconPath, {
      sizes: [32],
      quality: 100
    })
    // Creating URL shortcuts
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
 * Creating URL shortcut files
 * @param options UrlShortcutOptions Configuration options
 */
async function createUrlShortcut(options: UrlShortcutOptions): Promise<string> {
  const { url, iconPath, targetPath, name = 'url_shortcut', description = '' } = options

  try {
    // Ensure that the target directory exists
    await fse.ensureDir(targetPath)

    const tempName = `${name}_${Date.now()}`
    const tempPath = path.join(targetPath, `${tempName}.url`)
    const finalPath = path.join(targetPath, `${name}.url`)

    await fse.remove(finalPath)

    if (process.platform === 'win32') {
      // Windows URL shortcut format
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
      // Linux/macOS .desktop file
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

    // Verify that the file was created successfully
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
 * Converting images to ICO format
 * @param inputPath Input image path
 * @param outputPath Output Image Path
 * @param options Conversion options
 */
async function convertToIcon(
  inputPath: string,
  outputPath: string,
  options: IconConversionOptions = {}
): Promise<string> {
  try {
    const { sizes = [32], quality = 100, background = { r: 0, g: 0, b: 0, alpha: 0 } } = options

    // Make sure the output directory exists
    await fse.ensureDir(path.dirname(outputPath))

    // Check if the input file exists
    if (!(await fse.pathExists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`)
    }

    // Creating a Temporary PNG File Path
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

    // Convert PNG files to ICO format
    const icoBuffer = await pngToIco(tempPngPaths)
    await fse.writeFile(outputPath, icoBuffer)

    // Deleting Temporary PNG Files
    try {
      await Promise.all(tempPngPaths.map((tempPath) => fse.remove(tempPath)))
    } catch (cleanupError) {
      console.warn('清理临时文件时出错:', cleanupError)
      // Continued implementation as the main tasks have been completed
    }

    return outputPath
  } catch (error) {
    console.error('Error converting image:', error)
    throw error
  }
}
