import log from 'electron-log/main'
import * as fse from 'fs-extra'
import * as path from 'path'

// Define executable file extensions
const EXECUTABLE_EXTENSIONS = ['.exe', '.app', '.bat', '.cmd', '.sh', '.lnk', '.url']

// Concurrency control parameters
const MAX_CONCURRENCY = 10 // Maximum concurrency

export async function getGameFolders(dirPath: string): Promise<
  {
    name: string
    dirPath: string
  }[]
> {
  // Ensure directory exists
  if (!(await fse.pathExists(dirPath))) {
    throw new Error('Directory does not exist')
  }

  // Scan game folders
  return await scanForGameFolders(dirPath)
}

export async function getGameEntityFoldersByHierarchyLevel(
  rootPath: string,
  hierarchyLevel: number
): Promise<
  {
    name: string
    dirPath: string
  }[]
> {
  const level = Number.isFinite(hierarchyLevel) ? Math.max(0, Math.floor(hierarchyLevel)) : 0

  if (!(await fse.pathExists(rootPath))) {
    throw new Error('Directory does not exist')
  }

  const listSubdirectories = async (dirPath: string): Promise<string[]> => {
    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true })
      const dirs: string[] = []

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          dirs.push(fullPath)
          continue
        }

        if (entry.isSymbolicLink()) {
          try {
            const stats = await fse.stat(fullPath)
            if (stats.isDirectory()) dirs.push(fullPath)
          } catch (_error) {
            // ignore broken links / permission errors
          }
        }
      }

      return dirs
    } catch (error) {
      log.error('Error reading directory:', dirPath, error)
      return []
    }
  }

  // In hierarchy mode, the target entity folder is determined by path depth (not by executables).
  // level=0 => first-level subfolders under rootPath
  // level=1 => second-level subfolders under rootPath, etc.
  const targetDepth = level + 1
  let currentDirs = [path.normalize(rootPath)]

  for (let depth = 0; depth < targetDepth; depth++) {
    const childrenNested = await processBatch(currentDirs, listSubdirectories, MAX_CONCURRENCY)
    const children = childrenNested.flat().map((p) => path.normalize(p))
    currentDirs = Array.from(new Set(children))
    if (currentDirs.length === 0) break
  }

  return currentDirs
    .sort((a, b) => a.localeCompare(b))
    .map((dirPath) => ({ name: path.basename(dirPath), dirPath }))
}

async function scanForGameFolders(rootPath: string): Promise<
  {
    name: string
    dirPath: string
  }[]
> {
  // Read directory contents
  let items: fse.Dirent[] = []
  try {
    items = await fse.readdir(rootPath, { withFileTypes: true })
  } catch (error) {
    console.error('Error reading directory:', rootPath, error)
    return []
  }

  // Game folders result array
  const gameFolders: { name: string; dirPath: string }[] = []

  // Folders to scan further
  const foldersToScan: { name: string; dirPath: string }[] = []

  const results = await processBatch(
    items,
    async (item) => {
      if (!item.isDirectory() && !item.isSymbolicLink()) return null
      const fullPath = path.join(rootPath, item.name)

      try {
        let isDir = true
        if (item.isSymbolicLink()) {
          const stats = await fse.stat(fullPath)
          isDir = stats.isDirectory()
        }

        if (isDir) {
          // Check if this folder contains executable files
          const containsExecutable = await checkForExecutables(fullPath)

          if (containsExecutable) {
            // If contains executable file, mark as game folder
            return {
              type: 'game',
              folder: {
                name: item.name,
                dirPath: fullPath
              }
            }
          } else {
            // If doesn't contain executable file, add to scan list
            return {
              type: 'scan',
              folder: {
                name: item.name,
                dirPath: fullPath
              }
            }
          }
        }
        return null
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error)
        return null
      }
    },
    MAX_CONCURRENCY
  )

  // Categorize results
  results.forEach((result) => {
    if (!result) return

    if (result.type === 'game') {
      gameFolders.push(result.folder)
    } else {
      foldersToScan.push(result.folder)
    }
  })

  // Recursively scan subfolders with concurrency control
  const subFolderResults = await processBatch(
    foldersToScan,
    async (folder) => {
      return await scanForGameFolders(folder.dirPath)
    },
    MAX_CONCURRENCY
  )

  // Merge results
  subFolderResults.forEach((subGameFolders) => {
    gameFolders.push(...subGameFolders)
  })

  return gameFolders
}

async function checkForExecutables(dirPath: string): Promise<boolean> {
  try {
    const items = await fse.readdir(dirPath, { withFileTypes: true })
    let loopCount = 0

    for (const item of items) {
      if (++loopCount % 50 === 0) {
        // In long loops, yield to event loop to prevent blocking (especially for protocol.ts image requests)
        await new Promise((resolve) => setImmediate(resolve))
      }

      if (item.isSymbolicLink()) {
        const fullPath = path.join(dirPath, item.name)
        const stats = await fse.stat(fullPath)
        if (stats.isFile()) {
          const extension = path.extname(item.name).toLowerCase()
          if (EXECUTABLE_EXTENSIONS.includes(extension)) return true
        }
      } else if (item.isFile()) {
        const extension = path.extname(item.name).toLowerCase()
        if (EXECUTABLE_EXTENSIONS.includes(extension)) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error(`Error checking executables (${dirPath}):`, error)
    return false
  }
}

async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  const executing = new Set<Promise<void>>()

  for (const item of items) {
    // Yield to event loop to prevent blocking (especially for protocol.ts image requests)
    await new Promise((resolve) => setImmediate(resolve))

    // Create processing task
    const promise = processor(item)
      .then((result) => {
        results.push(result)
      })
      .catch((error) => {
        console.error('Error processing task:', error)
      })

    // Add task to executing pool
    executing.add(promise)

    // Remove task from pool when done
    promise.finally(() => executing.delete(promise))

    // If max concurrency reached, wait for at least one task to complete
    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }

  // Wait for all remaining tasks to complete
  await Promise.all(executing)

  return results
}

export type WalkOptions = {
  maxDepth?: number
  onDir?: (fullPath: string, depth: number) => void | Promise<void>
  onFile?: (fullPath: string, depth: number) => void | Promise<void>
  filter?: (name: string, fullPath: string, isDir: boolean) => boolean
}

export async function walkFs(root: string, options: WalkOptions = {}): Promise<void> {
  const { maxDepth = 50, onDir, onFile, filter } = options

  if (!(await fse.pathExists(root))) return

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return

    let entries: fse.Dirent[]

    try {
      entries = await fse.readdir(dir, { withFileTypes: true })

      let loopCount = 0

      for (const entry of entries) {
        if (++loopCount % 50 === 0) {
          // In long loops, yield to event loop to prevent blocking (especially for protocol.ts image requests)
          await new Promise((resolve) => setImmediate(resolve))
        }

        const full = path.join(dir, entry.name)
        const isDir = entry.isDirectory()

        if (filter && !filter(entry.name, full, isDir)) continue

        if (isDir) {
          await onDir?.(full, depth)
          await walk(full, depth + 1)
        } else {
          await onFile?.(full, depth)
        }
      }
    } catch (error) {
      log.error('Error walking directory:', error)
    }
  }

  await walk(root, 0)
}
