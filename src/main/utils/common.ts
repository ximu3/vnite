import fse from 'fs-extra'
import { shell, app } from 'electron'
import path from 'path'
import { getDataPath, getAppTempPath } from './path'
import { ConfigDBManager, GameDBManager } from '~/database'
import log from 'electron-log/main.js'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { fileTypeFromBuffer } from 'file-type'
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import koffi from 'koffi'

const execAsync = promisify(exec)

export function restartAppAsAdmin(): void {
  try {
    const shell32 = koffi.load('shell32.dll')
    const ShellExecuteA = shell32.func(
      'int ShellExecuteA(void*, const char*, const char*, const char*, const char*, int)'
    )

    const appPath = app.getPath('exe')

    // Get all command line arguments (except executable paths)
    const args = process.argv.slice(1)
    // Splices all parameters into a single string, preserving the original formatting
    const cmdArgs = args
      .map((arg) => {
        // Quoting parameters containing spaces or special characters
        return arg.includes(' ') || arg.includes('"') ? `"${arg.replace(/"/g, '\\"')}"` : arg
      })
      .join(' ')

    console.log('Restart the application with administrator privileges, parameter.', cmdArgs)
    // Use ShellExecuteA to start the application with administrator privileges and pass the full parameters
    const result = ShellExecuteA(null, 'runas', appPath, cmdArgs, '', 1)
    if (result > 32) {
      console.log(
        'Administrator privilege request successfully initiated, about to exit current instance'
      )
      setTimeout(() => app.exit(0), 100)
    } else {
      console.error('ShellExecute call failed with return code:', result)
    }
  } catch (error) {
    console.error('Failed to call ShellExecuteA with koffi:', error)
  }
}

/**
 * Check if a directory requires admin privileges to write to
 * @param directoryPath Directory path to check
 * @returns Whether admin privileges are required
 */
export async function checkIfDirectoryNeedsAdminRights(directoryPath: string): Promise<boolean> {
  const testFilePath = path.join(directoryPath, '.permission_test_' + Date.now())

  try {
    // Try to create a test file
    await fse.writeFile(testFilePath, 'test')
    // If successful, clean up and return false (admin privileges not required)
    await fse.remove(testFilePath)
    return false
  } catch (error) {
    // EPERM, EACCES indicate insufficient permissions
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        return true
      }
    }
    // Other errors (like directory doesn't exist)
    console.error('Error checking directory permissions:', error)
    return true // If in doubt, assume admin privileges are needed
  }
}

/**
 * Check if the current process has administrator permissions
 * @returns Whether the process has administrator permissions
 */
export async function checkAdminPermissions(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return false // Non-Windows platforms return false
  }
  try {
    await execAsync('net session')
    return true // The command was successfully executed with administrator privileges
  } catch (_error) {
    // Command execution failed, no administrator privileges
    return false
  }
}

export async function getLanguage(): Promise<string> {
  const language = await ConfigDBManager.getConfigValue('general.language')
  if (language) {
    return language
  } else {
    await ConfigDBManager.setConfigValue('general.language', app.getLocale())
    return app.getLocale()
  }
}

/**
 * Parse the game ID from a URL
 * @param url The URL
 * @returns The game ID or null if not found
 */
export function parseGameIdFromUrl(url: string): string | null {
  const match = url.match(/vnite:\/\/rungameid\/([^/\s]+)/)
  return match ? match[1] : null
}

export async function convertBufferToFile(buffer: Buffer, filePath: string): Promise<string> {
  try {
    await fse.writeFile(filePath, buffer)
    return filePath
  } catch (error) {
    console.error('Error converting buffer to file:', error)
    throw error
  }
}

export async function convertBufferToTempFile(buffer: Buffer, ext?: string): Promise<string> {
  try {
    if (!ext) {
      ext = (await fileTypeFromBuffer(buffer as Uint8Array))?.ext || 'bin'
    }
    const tempPath = getAppTempPath(`temp_${Date.now()}.${ext}`)
    await fse.writeFile(tempPath, buffer)
    return tempPath
  } catch (error) {
    console.error('Error converting buffer to temp file:', error)
    throw error
  }
}

export async function convertFileToBuffer(filePath: string): Promise<Buffer> {
  try {
    const buffer = await fse.readFile(filePath)
    return buffer
  } catch (error) {
    console.error('Error converting file to buffer:', error)
    throw error
  }
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
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
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
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
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

export async function openDatabasePathInExplorer(): Promise<void> {
  const databasePath = getDataPath()
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
    throw new Error('Catalog does not exist')
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
    const gameName = await GameDBManager.getGameValue(gameId, 'metadata.name')

    const originalIconPath = await GameDBManager.getGameImage(gameId, 'icon', 'file')

    // ico icon path
    const iconPath = getAppTempPath(`icon_${gameId}_${Date.now()}.ico`)

    // Convert icons to ico format
    if (originalIconPath) {
      await convertToIcon(originalIconPath, iconPath, {
        sizes: [32],
        quality: 100
      })
    }
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
      console.warn('Error clearing temporary files:', cleanupError)
      // Continued implementation as the main tasks have been completed
    }

    return outputPath
  } catch (error) {
    console.error('Error converting image:', error)
    throw error
  }
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  try {
    return await fse.readFile(filePath)
  } catch (error) {
    console.error('Error reading file buffer:', error)
    throw error
  }
}

export async function cropImage({
  sourcePath,
  x,
  y,
  width,
  height
}: {
  sourcePath: string
  x: number
  y: number
  width: number
  height: number
}): Promise<string> {
  try {
    const ext = path.extname(sourcePath).slice(1)
    const tempPath = getAppTempPath(`cropped_${Date.now()}.${ext}`)
    sharp.cache(false)
    await sharp(sourcePath, { animated: true, limitInputPixels: false })
      .extract({ left: x, top: y, width, height })
      .toFile(tempPath)

    return tempPath
  } catch (error) {
    console.error('Error cropping image:', error)
    throw error
  }
}

// Cache interface definition
interface CacheItem {
  size: number
  timestamp: number
}

// In-memory cache object
const sizeCache: Record<string, CacheItem> = {}

// Cache TTL (15 minutes in milliseconds)
const CACHE_TTL = 15 * 60 * 1000

/**
 * Get total size of CouchDB user databases with 15-minute cache
 * @param username - User identifier for database queries
 * @returns Promise resolving to total database size in bytes
 */
export async function getCouchDbSize(username: string): Promise<number> {
  const cacheKey = `couchdb_size_${username}`

  // Check if we have valid cache entry
  const cacheData = sizeCache[cacheKey]
  if (cacheData && Date.now() - cacheData.timestamp < CACHE_TTL) {
    console.log(`Using cached size for ${username}: ${cacheData.size} bytes`)
    return cacheData.size
  }

  // Cache doesn't exist or has expired, execute original logic
  try {
    const serverUrl = import.meta.env.VITE_COUCHDB_SERVER_URL
    const adminUsername = import.meta.env.VITE_COUCHDB_USERNAME
    const adminPassword = import.meta.env.VITE_COUCHDB_PASSWORD

    if (!serverUrl) {
      throw new Error('Missing CouchDB server URL')
    }

    const dbs = ['game', 'config', 'game-collection']
    let dbSize = 0

    // Query each database and sum up the sizes
    for (const db of dbs) {
      const dbName = `${username}-${db}`.replace('user', 'userdb')
      const url = `${serverUrl}/${dbName}`

      const response = await axios.get(url, {
        auth: {
          username: adminUsername,
          password: adminPassword
        }
      })

      if (response.data && response.data.sizes && response.data.sizes.file) {
        dbSize += response.data.sizes.file
      } else {
        throw new Error(`Failed to get size for ${dbName}`)
      }
    }

    // Create new cache item with current timestamp
    sizeCache[cacheKey] = {
      size: dbSize,
      timestamp: Date.now()
    }

    return dbSize
  } catch (error) {
    console.error('Error getting CouchDB size:', error)
    throw error
  }
}
