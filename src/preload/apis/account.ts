import { ipcRenderer } from 'electron'

export const accountAPI = {
  async authSignin(): Promise<boolean> {
    return await ipcRenderer.invoke('auth-signin')
  },

  async authSignup(): Promise<boolean> {
    return await ipcRenderer.invoke('auth-signup')
  }
}
