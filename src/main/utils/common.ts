import axios from 'axios'
import { exec } from 'child_process'
import { app, shell } from 'electron'
import log from 'electron-log/main.js'
import { fileTypeFromBuffer } from 'file-type'
import fse from 'fs-extra'
import koffi from 'koffi'
import path from 'path'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'
import { promisify } from 'util'
import { getAppTempPath, getDataPath } from '~/features/system'
import { psManager } from './Powershell'
import { net } from 'electron'

const execAsync = promisify(exec)

/**
 * 创建远程官方数据库并设置访问权限
 * @param remoteUrl 远程CouchDB服务器URL
 * @param remoteDbName 要创建的数据库名称
 * @param username 需要授予访问权限的用户名
 * @param adminUsername 管理员用户名
 * @param adminPassword 管理员密码
 */
export async function createOfficialRemoteDBWithPermissions(
  remoteUrl: string,
  remoteDbName: string,
  username: string,
  adminUsername: string,
  adminPassword: string
): Promise<void> {
  try {
    // 第一步：创建数据库（如果不存在）
    const createResponse = await net.fetch(`${remoteUrl}/${remoteDbName}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + btoa(`${adminUsername}:${adminPassword}`),
        'Content-Type': 'application/json'
      }
    })

    const createData = await createResponse.json().catch(() => ({}))

    // 如果数据库已存在，直接返回
    if (!createResponse.ok && createData.error === 'file_exists') {
      return
    }

    // 其他错误情况仍然抛出
    if (!createResponse.ok) {
      throw new Error(`创建数据库失败: ${createData.reason || '未知错误'}`)
    }

    // 第二步：设置数据库安全文档
    const securityDoc = {
      admins: {
        names: [adminUsername],
        roles: ['_admin']
      },
      members: {
        names: [username],
        roles: []
      }
    }

    const securityResponse = await net.fetch(`${remoteUrl}/${remoteDbName}/_security`, {
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + btoa(`${adminUsername}:${adminPassword}`),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(securityDoc)
    })

    if (!securityResponse.ok) {
      const securityData = await securityResponse.json().catch(() => ({}))
      throw new Error(`设置数据库权限失败: ${securityData.reason || '未知错误'}`)
    }

    log.info(`已成功创建官方数据库 ${remoteDbName} 并设置权限，用户 ${username} 已被授予访问权限`)
  } catch (error) {
    log.error(`创建远程官方数据库或设置权限时出错:`, error)
    throw error
  }
}

/**
 * 将文件复制到剪贴板
 * @param filePath 要复制的文件路径
 * @returns Promise<boolean> 是否成功复制
 */
export async function copyFileToClipboard(filePath: string): Promise<boolean> {
  try {
    // 确保文件存在
    if (!(await fse.pathExists(filePath))) {
      throw new Error(`文件不存在: ${filePath}`)
    }

    // 确保使用绝对路径
    const absolutePath = path.resolve(filePath)

    // PowerShell命令：将文件添加到剪贴板
    const psCommand = `
      Add-Type -AssemblyName System.Windows.Forms
      $filePath = "${absolutePath.replace(/\\/g, '\\\\')}"
      $fileCollection = New-Object System.Collections.Specialized.StringCollection
      $fileCollection.Add($filePath) | Out-Null
      [System.Windows.Forms.Clipboard]::SetFileDropList($fileCollection)
      "Success"
    `

    // 执行PowerShell命令
    const result = await psManager.executeCommand(psCommand)

    return result.includes('Success')
  } catch (error) {
    log.error('复制文件到剪贴板失败:', error)
    return false
  }
}

/**
 * 获取目录大小（字节）
 */
export async function getDirSize(dirPath: string): Promise<number> {
  let size = 0
  const files = await fse.readdir(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = await fse.stat(filePath)

    if (stats.isDirectory()) {
      size += await getDirSize(filePath)
    } else {
      size += stats.size
    }
  }

  return size
}

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
 * Get subfolders at a specific depth level in the specified directory
 * @param dirPath Directory path
 * @param depth Target depth (1 means first level subfolders, 2 means second level subfolders, and so on)
 * @returns Promise<{name: string, dirPath: string}[]> Array of subfolder information at the specified depth
 */
export async function getSubfoldersByDepth(
  dirPath: string,
  depth: number = 1
): Promise<
  {
    name: string
    dirPath: string
  }[]
> {
  // Ensure the directory exists
  if (!(await fse.pathExists(dirPath))) {
    throw new Error('Directory does not exist')
  }

  // Use helper function to recursively find folders at the specified depth
  return await findFoldersAtDepth(dirPath, 1, depth)
}

/**
 * Recursively find folders at the specified depth
 * @param currentPath Current path
 * @param currentDepth Current depth
 * @param targetDepth Target depth
 * @returns Promise<{name: string, dirPath: string}[]> Array of folder information
 */
async function findFoldersAtDepth(
  currentPath: string,
  currentDepth: number,
  targetDepth: number
): Promise<
  {
    name: string
    dirPath: string
  }[]
> {
  // Read directory contents
  const items = await fse.readdir(currentPath)

  // Filter out folders
  const subfolders = (
    await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(currentPath, item)
        try {
          const stats = await fse.stat(fullPath)
          return {
            name: item,
            dirPath: fullPath,
            isDirectory: stats.isDirectory()
          }
        } catch (error) {
          log.error('Error reading directory:', error)
          return undefined
        }
      })
    )
  ).filter(Boolean) as Array<{
    name: string
    dirPath: string
    isDirectory: boolean
  }>

  const directories = subfolders.filter((item) => item.isDirectory)

  // If current depth equals target depth, return these folders
  if (currentDepth === targetDepth) {
    return directories.map((item) => ({
      name: item.name,
      dirPath: item.dirPath
    }))
  }

  // If current depth is less than target depth, continue recursively searching the next level
  if (currentDepth < targetDepth) {
    const results = await Promise.all(
      directories.map((dir) => findFoldersAtDepth(dir.dirPath, currentDepth + 1, targetDepth))
    )

    // Merge all results
    return results.flat()
  }

  // If current depth is greater than target depth (should not happen), return empty array
  return []
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
 * Creating URL shortcut files
 * @param options UrlShortcutOptions Configuration options
 */
export async function createUrlShortcut(options: UrlShortcutOptions): Promise<string> {
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
export async function convertToIcon(
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
export async function getCouchDBSize(username: string): Promise<number> {
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

async function getFolderSize(folderPath: string): Promise<number> {
  let totalSize = 0
  try {
    const entries = await fse.readdir(folderPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name)
      if (entry.isDirectory()) {
        totalSize += await getFolderSize(fullPath)
      } else if (entry.isFile()) {
        const stat = await fse.stat(fullPath)
        totalSize += stat.size
      }
    }
  } catch {
    return NaN
  }
  return totalSize
}

/**
 * Get the total size of multiple paths (files or directories)
 * @param paths Array of file or directory paths
 * @returns Promise resolving to total size in bytes (NaN if the path doesn't exist)
 */
export async function getTotalPathSize(paths: string[]): Promise<number> {
  const sizes = await Promise.all(
    paths.map(async (p) => {
      try {
        const stat = await fse.stat(p)
        if (stat.isDirectory()) {
          return await getFolderSize(p)
        } else if (stat.isFile()) {
          return stat.size
        } else {
          return 0
        }
      } catch (err) {
        console.error('Error getting size for path:', p, err)
        return NaN
      }
    })
  )
  if (sizes.some((s) => Number.isNaN(s))) {
    return NaN
  }
  return sizes.reduce((acc, cur) => acc + cur, 0)
}
