// src/main/auth-server.ts
import { Server, createServer } from 'http'
import { parse } from 'url'
import { EventEmitter } from 'events'
import { AuthCallbackData } from '@appTypes/sync'

class AuthCallbackServer extends EventEmitter {
  private port: number
  private server: Server | null = null

  constructor(port: number = 9323) {
    super()
    this.port = port
  }

  public start(): Promise<number> {
    if (this.server) {
      return Promise.resolve(this.port)
    }

    return new Promise<number>((resolve, reject) => {
      this.server = createServer((req, res) => {
        const parsedUrl = parse(req.url || '', true)

        if (parsedUrl.pathname === '/callback') {
          // 发送成功页面
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>注册/登录成功</title>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 50px; background-color: #f5f5f5; }
                  .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .success-icon { font-size: 64px; color: #4CAF50; margin-bottom: 20px; }
                  h1 { color: #333; }
                  p { color: #666; line-height: 1.6; }
                  .closing { font-size: 14px; color: #999; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success-icon">✓</div>
                  <h1>操作成功</h1>
                  <p>您已成功完成认证，可以关闭此窗口并返回应用程序。</p>
                  <p class="closing">此窗口将在3秒后自动关闭...</p>
                </div>
                <script>
                  setTimeout(() => window.close(), 3000);
                </script>
              </body>
            </html>
          `)

          // 获取授权码并触发事件
          const code = parsedUrl.query.code as string
          const state = parsedUrl.query.state as string | undefined

          if (code) {
            this.emit('auth-code', { code, state } as AuthCallbackData)
          }
        } else {
          // 处理其他路径
          res.writeHead(404)
          res.end('Not Found')
        }
      })

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`端口 ${this.port} 已被占用`))
        } else {
          reject(err)
        }
      })

      this.server.listen(this.port, () => {
        console.log(`认证服务器运行在 http://localhost:${this.port}`)
        resolve(this.port)
      })
    })
  }

  public stop(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.server) {
        return resolve()
      }

      this.server.close(() => {
        this.server = null
        console.log('认证服务器已关闭')
        resolve()
      })
    })
  }
}

export default AuthCallbackServer
