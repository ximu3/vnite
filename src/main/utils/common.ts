import { exec } from 'child_process'
import { app, shell } from 'electron'
import log from 'electron-log/main'
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
import { parse, isValid, format, parseISO } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

const execAsync = promisify(exec)

export async function createOfficialRemoteDBWithPermissions(
  remoteUrl: string,
  remoteDbName: string,
  username: string,
  adminUsername: string,
  adminPassword: string
): Promise<void> {
  try {
    // First step: Create the remote database
    const createResponse = await net.fetch(`${remoteUrl}/${remoteDbName}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + btoa(`${adminUsername}:${adminPassword}`),
        'Content-Type': 'application/json'
      }
    })

    const createData = await createResponse.json().catch(() => ({}))

    // If the database already exists, return directly
    if (!createResponse.ok && createData.error === 'file_exists') {
      return
    }

    // Other error cases still throw
    if (!createResponse.ok) {
      throw new Error(`Failed to create database: ${createData.reason || 'Unknown error'}`)
    }

    // Second step: Set up the database security document
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
      throw new Error(
        `Failed to set database permissions: ${securityData.reason || 'Unknown error'}`
      )
    }

    log.info(
      `[Utils] Successfully created official database ${remoteDbName} and set permissions, user ${username} has been granted access`
    )
  } catch (error) {
    log.error(`[Utils] Error creating remote official database or setting permissions:`, error)
    throw error
  }
}

export async function copyFileToClipboard(filePath: string): Promise<boolean> {
  try {
    // Ensure the file exists
    if (!(await fse.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`)
    }

    // Ensure absolute path is used
    const absolutePath = path.resolve(filePath)

    // PowerShell command: Add the file to clipboard
    const psCommand = `
      Add-Type -AssemblyName System.Windows.Forms
      $filePath = "${absolutePath.replace(/\\/g, '\\\\')}"
      $fileCollection = New-Object System.Collections.Specialized.StringCollection
      $fileCollection.Add($filePath) | Out-Null
      [System.Windows.Forms.Clipboard]::SetFileDropList($fileCollection)
      "Success"
    `

    // Execute PowerShell command
    const result = await psManager.executeCommand(psCommand)

    return result.includes('Success')
  } catch (error) {
    log.error(`[Utils] Error copying file to clipboard:`, error)
    return false
  }
}

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

export function getAppVersion(): string {
  return app.getVersion()
}

export async function openPathInExplorer(filePath: string): Promise<void> {
  try {
    // Check if the path exists
    const stats = await fse.stat(filePath)

    // If it's a file, get its directory path
    const dirPath = stats.isFile() ? path.dirname(filePath) : filePath

    // Open the path using Electron's shell module
    shell.openPath(dirPath)
  } catch (error) {
    log.error('[Utils] Error opening path:', error)
  }
}

export async function openDatabasePathInExplorer(): Promise<void> {
  try {
    const databasePath = getDataPath()
    if (databasePath) {
      await openPathInExplorer(databasePath)
    }
  } catch (error) {
    log.error('[Utils] Error opening database path in explorer:', error)
    throw error
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatDate(dateString: string, outputFormat: string = 'yyyy-MM-dd'): string {
  if (!dateString) return ''

  try {
    // Try to parse the date string directly
    try {
      const date = parseISO(dateString)
      if (isValid(date)) {
        return format(date, outputFormat)
      }
    } catch {
      // Ignore errors
    }

    // Define common formats and locales
    const formats = [
      { format: 'yyyy-MM-dd', locale: undefined },
      { format: 'dd/MM/yyyy', locale: undefined },
      { format: 'MM/dd/yyyy', locale: undefined },
      { format: 'yyyy年MM月dd日', locale: zhCN },
      { format: 'yyyy年 MM月 dd日', locale: zhCN },
      { format: 'yyyy 年 MM 月 dd 日', locale: zhCN },
      { format: 'dd MMM yyyy', locale: enUS },
      { format: 'MMMM dd, yyyy', locale: enUS }
    ]

    // Try parsing with each format
    for (const { format: fmt, locale } of formats) {
      try {
        const parsedDate = parse(dateString, fmt, new Date(), { locale })
        if (isValid(parsedDate)) {
          return format(parsedDate, outputFormat)
        }
      } catch {
        // Ignore errors for this format
        continue
      }
    }

    // If all parsing attempts fail, try to create a Date object directly
    const jsDate = new Date(dateString)
    if (isValid(jsDate)) {
      return format(jsDate, outputFormat)
    }

    log.warn(`[Utils] Unable to parse date: ${dateString}`)
    // If all parsing attempts fail, return an empty string
    return ''
  } catch {
    log.error(`[Utils] Error formatting date: ${dateString}`)
    return ''
  }
}

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
    log.error('[Utils] Error creating URL shortcut:', error)
    throw error
  }
}

interface IconConversionOptions {
  sizes?: number[]
  quality?: number
  background?: sharp.Color
}

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
