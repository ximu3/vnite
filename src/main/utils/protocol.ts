import { protocol, app } from 'electron'
import { getDataPathSync } from './path'
import { MemoryImageCache } from './imgCache'
import path from 'path'
import fse from 'fs-extra'

export function setupProtocols(): void {
  const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.ico', '.gif']

  const imageCache = new MemoryImageCache()

  protocol.handle('img', async (request: Request) => {
    try {
      const urlObj = new URL(request.url)
      const relativePath = decodeURIComponent(urlObj.pathname).replace(/^\//, '')
      const timestamp = urlObj.searchParams.get('t') || '0'

      const dataPath = getDataPathSync('')
      const baseFilePath = path.join(dataPath, relativePath)
      const cacheKey = Buffer.from(relativePath).toString('base64')

      // Checking the memory cache
      const cachedData = imageCache.get(cacheKey, timestamp)

      // If there are cached results (including non-existent tokens)
      if (cachedData !== undefined) {
        // If the cache shows that the image does not exist
        if (cachedData === null) {
          console.log('Serving negative cache:', cacheKey)
          return new Response('Error loading file', { status: 404 })
        }

        // If there is image data in the cache
        console.log('Serving from memory cache:', cacheKey)
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
            const fileData = await fse.readFile(fullPath)
            imageCache.set(cacheKey, fileData, timestamp)

            return new Response(fileData, {
              status: 200,
              headers: {
                'Content-Type': getContentType(ext),
                'Cache-Control': 'public, max-age=31536000'
              }
            })
          } catch (error) {
            console.error('Error reading file:', error)
            continue
          }
        }
      }

      // Image does not exist, set negative caching
      console.log('Setting negative cache:', cacheKey)
      imageCache.set(cacheKey, null, timestamp)
      return new Response('Error loading file', { status: 404 })
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

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('vnite', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('vnite')
  }
}
