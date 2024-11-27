import { BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main.js'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // 开发环境配置
  if (process.env.NODE_ENV === 'development') {
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.autoDownload = false

  // 添加错误处理
  autoUpdater.on('error', (error) => {
    log.error('更新错误:', error)
    mainWindow?.webContents.send('update-error', error.message)
  })

  // 添加检查更新开始的处理
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...')
    mainWindow?.webContents.send('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('发现新版本:', info)
    const updateInfo = {
      version: info.version,
      releaseNotes: Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((note) => note.note).join('\n')
        : info.releaseNotes || ''
    }
    mainWindow?.webContents.send('update-available', updateInfo)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('当前已是最新版本:', info)
    mainWindow?.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    log.info('下载进度:', progressObj)
    mainWindow?.webContents.send('update-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('更新已下载完成')
    mainWindow?.webContents.send('update-downloaded')
  })

  ipcMain.handle('start-update', async () => {
    try {
      return await autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('下载更新失败:', error)
      throw error
    }
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // 添加手动检查更新的处理器
  ipcMain.handle('check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('检查更新失败:', error)
      throw error
    }
  })

  // 延迟检查更新，确保窗口已完全加载
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('自动检查更新失败:', error)
    })
  }, 3000)
}
