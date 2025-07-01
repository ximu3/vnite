import { ipcRenderer } from 'electron'
import type { OpenDialogOptions } from 'electron'

export const utilsAPI = {
  async generateUUID(): Promise<string> {
    return await ipcRenderer.invoke('generate-uuid')
  },

  async selectPathDialog(
    properties: NonNullable<OpenDialogOptions['properties']>,
    filters?: { name: string, extensions: string[] }[],
    defaultPath?: string
  ): Promise<string> {
    return await ipcRenderer.invoke('select-path-dialog', properties, filters, defaultPath)
  },

  async selectMultiplePathDialog(
    properties: NonNullable<OpenDialogOptions['properties']>,
    filters?: { name: string, extensions: string[] }[],
    defaultPath?: string
  ): Promise<string[]> {
    return await ipcRenderer.invoke(
      'select-multiple-path-dialog',
      properties,
      filters,
      defaultPath
    )
  },

  async getPathSize(paths: string[]): Promise<number> {
    return await ipcRenderer.invoke('get-path-size', paths)
  },

  async openPathInExplorer(filePath: string): Promise<void> {
    return await ipcRenderer.invoke('open-path-in-explorer', filePath)
  },

  async openDatabasePathInExplorer(): Promise<void> {
    return await ipcRenderer.invoke('open-database-path-in-explorer')
  },

  async createGameShortcut(gameId: string, targetPath: string): Promise<void> {
    return await ipcRenderer.invoke('create-game-shortcut', gameId, targetPath)
  },

  async updateOpenAtLogin(): Promise<void> {
    return await ipcRenderer.invoke('update-open-at-login')
  },

  async updateTrayConfig(): Promise<void> {
    return await ipcRenderer.invoke('update-tray-config')
  },

  async getAppVersion(): Promise<string> {
    return await ipcRenderer.invoke('get-app-version')
  },

  async isPortableMode(): Promise<boolean> {
    return await ipcRenderer.invoke('is-portable-mode')
  },

  async switchDatabaseMode(): Promise<void> {
    return await ipcRenderer.invoke('switch-database-mode')
  },

  async readFileBuffer(filePath: string): Promise<Buffer> {
    return await ipcRenderer.invoke('read-file-buffer', filePath)
  },

  async getLanguage(): Promise<string> {
    return await ipcRenderer.invoke('get-language')
  },

  async checkAdminPermissions(): Promise<boolean> {
    return await ipcRenderer.invoke('check-admin-permissions')
  },

  async checkIfPortableDirectoryNeedsAdminRights(): Promise<boolean> {
    return await ipcRenderer.invoke('check-if-portable-directory-needs-admin-rights')
  },

  async updateLanguage(language: string): Promise<void> {
    return await ipcRenderer.invoke('update-language', language)
  },

  // Window control methods
  minimize(): void {
    ipcRenderer.send('minimize')
  },

  quitToTray(): void {
    ipcRenderer.send('quit-to-tray')
  },

  restoreAndFocus(): void {
    ipcRenderer.send('restore-and-focus')
  },

  maximize(): void {
    ipcRenderer.send('maximize')
  },

  close(): void {
    ipcRenderer.send('close')
  },

  relaunchApp(): void {
    ipcRenderer.send('relaunch-app')
  }
}
