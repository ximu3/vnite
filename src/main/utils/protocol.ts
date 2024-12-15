import { protocol, app } from 'electron'
import { getDataPathSync, getAppTempPath } from './path'
import path from 'path'
import fse from 'fs-extra'

export function setupProtocols(): void {
  const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.ico', '.gif']

  // 创建缓存目录
  const CACHE_DIR = getAppTempPath('images')
  fse.ensureDirSync(CACHE_DIR)

  protocol.handle('img', async (request) => {
    try {
      const urlObj = new URL(request.url)
      const relativePath = decodeURIComponent(urlObj.pathname).replace(/^\//, '')
      const timestamp = urlObj.searchParams.get('t') || '0'

      const dataPath = getDataPathSync('')
      const baseFilePath = path.join(dataPath, relativePath)

      // Use hash to create cached filenames to avoid long paths or special characters.
      const cacheKey = Buffer.from(relativePath).toString('base64')
      const cachePath = path.join(CACHE_DIR, `${cacheKey}.${timestamp}`)

      // Check the cache
      if (await fse.pathExists(cachePath)) {
        console.log('Serving from cache:', cachePath)
        const cachedData = await fse.readFile(cachePath)
        return new Response(cachedData, {
          status: 200,
          headers: {
            'Content-Type': getContentType(path.extname(baseFilePath)),
            'Cache-Control': 'public, max-age=31536000'
          }
        })
      }

      // Try all possible extensions
      for (const ext of IMAGE_EXTENSIONS) {
        const fullPath = baseFilePath + ext

        if (await fse.pathExists(fullPath)) {
          try {
            // Read the original file
            const fileData = await fse.readFile(fullPath)

            // Write to cache
            await fse.writeFile(cachePath, fileData)

            return new Response(fileData, {
              status: 200,
              headers: {
                'Content-Type': getContentType(ext),
                'Cache-Control': 'public, max-age=31536000'
              }
            })
          } catch (error) {
            console.error('Error reading/caching file:', error)
            continue
          }
        }
      }

      throw new Error('No matching image file found')
    } catch (error) {
      console.error('Protocol error:', error)
      return new Response('Error loading file', { status: 404 })
    }
  })

  // Get the MIME type
  function getContentType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.ico': 'image/x-icon',
      '.gif': 'image/gif'
    }
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
  }

  // Clear expired cache
  async function cleanupOldCache(): Promise<void> {
    try {
      const files = await fse.readdir(CACHE_DIR)
      const now = Date.now()

      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file)
        const stats = await fse.stat(filePath)

        // Delete cached files older than 30 days
        if (now - stats.mtimeMs > 30 * 24 * 60 * 60 * 1000) {
          await fse.remove(filePath)
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error)
    }
  }

  // Clean cache regularly (run once a day)
  setInterval(cleanupOldCache, 24 * 60 * 60 * 1000)

  // Run a cleanup on startup as well
  cleanupOldCache()

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('vnite', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('vnite')
  }
}

// Export the cache cleanup methods to be called manually if needed.
export async function clearImageCache(): Promise<void> {
  const CACHE_DIR = path.join(getDataPathSync(''), '.cache', 'images')
  try {
    await fse.emptyDir(CACHE_DIR)
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}
