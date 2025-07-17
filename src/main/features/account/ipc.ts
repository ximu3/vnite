import { AuthManager } from './services'
import { ipcManager } from '~/core/ipc'

export function setupAccountIPC(): void {
  ipcManager.handle('account:auth-signin', async (_) => {
    try {
      await AuthManager.startSignin()
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  })

  ipcManager.handle('account:auth-signup', async () => {
    try {
      await AuthManager.startSignup()
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  })
}
