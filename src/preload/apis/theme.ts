import { ipcRenderer } from 'electron'

export const themeAPI = {
  async saveTheme(cssContent: string): Promise<void> {
    return await ipcRenderer.invoke('save-theme', cssContent)
  },

  async loadTheme(): Promise<string> {
    return await ipcRenderer.invoke('load-theme')
  },

  async themePreset(preset: string): Promise<string> {
    return await ipcRenderer.invoke('theme-preset', preset)
  },

  async setConfigBackground(filePaths: string[]): Promise<void> {
    return await ipcRenderer.invoke('set-config-background', filePaths)
  },

  async getConfigBackground<T = any>(format = 'buffer', namesOnly = false): Promise<T> {
    return await ipcRenderer.invoke('get-config-background', format, namesOnly);
  }
}
