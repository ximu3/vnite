import { protocol, net, app, BrowserWindow } from 'electron'
import path from 'path'
import { getDBValue } from '~/database'

// 存储启动参数，用于应用完全启动后处理
let launchGameId: string | null = null

export function setupProtocols(): void {
  // 处理启动参数
  const args = process.argv
  const deepLinkUrl = args.find((arg) => arg.startsWith('vnite://'))
  if (deepLinkUrl) {
    launchGameId = parseGameIdFromUrl(deepLinkUrl)
  }

  // 注册 app 协议处理
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

  // 注册 vnite 协议处理
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('vnite', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('vnite')
  }

  // 处理 Windows 和 Linux 的协议调用
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (_event, commandLine) => {
      // 获取并处理 URL
      const url = commandLine.find((arg) => arg.startsWith('vnite://'))
      if (url) {
        handleGameUrl(url)
      }

      // 如果窗口已最小化，则恢复窗口
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
  }

  // 处理 macOS 的协议调用
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleGameUrl(url)
  })

  // 当应用准备就绪时，处理启动参数
  app.whenReady().then(() => {
    if (launchGameId) {
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) {
        // 等待一段时间确保渲染进程已经准备就绪
        setTimeout(async () => {
          const gamePath = await getDBValue(`games/${launchGameId}/path.json`, ['gamePath'], '')
          const mode = await getDBValue(`games/${launchGameId}/launcher.json`, ['mode'], '')
          const config = await getDBValue(
            `games/${launchGameId}/launcher.json`,
            [`${mode}Config`],
            {}
          )
          mainWindow.webContents.send('start-game-from-url', launchGameId, gamePath, mode, config)
          launchGameId = null
        }, 2000) // 可以根据需要调整延时
      }
    }
  })
}

// 解析 URL 获取游戏 ID
function parseGameIdFromUrl(url: string): string | null {
  const match = url.match(/vnite:\/\/rungameid\/([^/\s]+)/)
  return match ? match[1] : null
}

// 处理游戏启动 URL
async function handleGameUrl(url: string): Promise<void> {
  try {
    const gameId = parseGameIdFromUrl(url)
    if (!gameId) {
      console.error('Invalid game URL format')
      return
    }

    console.log('Launching game with ID:', gameId)

    // 获取主窗口并发送消息
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      // 确保窗口可见
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()

      // 发送启动游戏消息
      const gamePath = await getDBValue(`games/${gameId}/path.json`, ['gamePath'], '')
      const mode = await getDBValue(`games/${gameId}/launcher.json`, ['mode'], '')
      const config = await getDBValue(`games/${gameId}/launcher.json`, [`${mode}Config`], {})
      mainWindow.webContents.send('start-game-from-url', gameId, gamePath, mode, config)
    } else {
      // 如果窗口还未创建，存储gameId等待窗口创建后启动
      launchGameId = gameId
    }
  } catch (error) {
    console.error('Error handling game URL:', error)
  }
}
