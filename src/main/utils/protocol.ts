import { protocol, net } from 'electron'
import path from 'path'

export function setupProtocols(): void {
  protocol.handle('app', async (request) => {
    try {
      // 解析 URL
      const urlObj = new URL(request.url)

      // 从 pathname 获取相对路径，移除开头的斜杠
      const relativePath = decodeURIComponent(urlObj.pathname).replace(/^\//, '')

      // 转换为绝对路径
      const filePath = path.resolve(relativePath)

      console.log('Request URL:', request.url)
      console.log('File path:', filePath)

      // 构建 file:// URL（确保使用正斜杠）
      const fileUrl = 'file:///' + filePath.split(path.sep).join('/')

      console.log('File URL:', fileUrl)

      // 使用 net.fetch 加载文件
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
}
