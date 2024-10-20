import * as fse from 'fs-extra'
import * as path from 'path'
import { Watcher } from './common'
import { BrowserWindow } from 'electron'
import { getDataPath } from '~/utils'

const watchers: Watcher[] = []

export async function setupDBWatcher(
  targetFileNames: string[],
  mainWindow: BrowserWindow
): Promise<void> {
  const maxDepth = 3
  const basePath = await getDataPath('')
  const queue: { path: string; depth: number }[] = [{ path: basePath, depth: 1 }]

  while (queue.length > 0) {
    const { path: currentPath, depth } = queue.shift()!

    if (depth > maxDepth) continue

    const items = await fse.readdir(currentPath, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name)

      if (item.isDirectory()) {
        queue.push({ path: fullPath, depth: depth + 1 })
      } else if (item.isFile() && targetFileNames.includes(item.name)) {
        const dbWatcher = new Watcher(path.relative(basePath, fullPath), fullPath, mainWindow)
        dbWatcher.start()
        watchers.push(dbWatcher)
      }
    }
  }
}

export function stopWatchers(): void {
  for (const watcher of watchers) {
    watcher.stop()
  }
}
