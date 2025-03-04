import { AuthManager } from '~/account'
import { ipcMain, BrowserWindow } from 'electron'

export function setupAccountIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('auth-signin', async (_) => {
    try {
      await AuthManager.startSignin()
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  })

  ipcMain.handle('auth-signup', async () => {
    try {
      await AuthManager.startSignup()
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  })

  mainWindow.webContents.send('accountIPCReady')
}
