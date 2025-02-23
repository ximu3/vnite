import { protocol, app } from 'electron'
import { DBManager } from '~/database'
import path from 'path'

export function setupProtocols(): void {
  protocol.handle('attachment', async (request: Request) => {
    try {
      const url = new URL(request.url)
      const [dbName, docId, attachmentId] = url.pathname.slice(1).split('/')

      const attachment = await DBManager.getAttachment(dbName, docId, attachmentId)

      return new Response(attachment, {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'cache-control': 'public, max-age=3600'
        }
      })
    } catch (error) {
      console.error('Protocol error:', error)
      return new Response('Error loading file', { status: 404 })
    }
  })

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('vnite', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('vnite')
  }
}
