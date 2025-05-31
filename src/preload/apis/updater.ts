import { ipcRenderer } from 'electron'

export const updaterAPI = {
  async checkUpdate(): Promise<any> {
    return await ipcRenderer.invoke('check-update')
  },

  async startUpdate(): Promise<void> {
    return await ipcRenderer.invoke('start-update')
  },

  async installUpdate(): Promise<void> {
    return await ipcRenderer.invoke('install-update')
  },

  async updateUpdaterConfig(): Promise<void> {
    return await ipcRenderer.invoke('update-updater-config')
  }
}
