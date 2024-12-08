import { protocol, net, app } from 'electron'
import path from 'path'

export function setupProtocols(): void {
  // Registered app protocol processing
  protocol.handle('app', async (request) => {
    try {
      const urlObj = new URL(request.url)
      const relativePath = decodeURIComponent(urlObj.pathname).replace(/^\//, '')
      const filePath = path.resolve(relativePath)

      console.log('Request URL:', request.url)
      console.log('File path:', filePath)

      const fileUrl = 'file:///' + filePath.split(path.sep).join('/')
      console.log('File URL:', fileUrl)

      const response = await net.fetch(fileUrl)

      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status}`)
      }

      return response
    } catch (error) {
      console.error('Protocol error:', error)
      return new Response('Error loading file', {
        status: 404
      })
    }
  })

  // Registering for vnite protocol processing
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('vnite', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('vnite')
  }
}
