import { ipcRenderer } from 'electron'
import { OverallScanProgress } from '@appTypes/utils'

export const gameScannerAPI = {
  async scanAll(): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:scan-all')
  },

  async scanScanner(scannerId: string): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:scan-scanner', scannerId)
  },

  async stopScan(): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:stop-scan')
  },

  async getProgress(): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:get-progress')
  },

  async fixFolder(
    folderPath: string,
    gameId: string,
    dataSource: string
  ): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:fix-folder', folderPath, gameId, dataSource)
  },

  async startPeriodicScan(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }> {
    return await ipcRenderer.invoke('game-scanner:start-periodic-scan')
  },

  async stopPeriodicScan(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }> {
    return await ipcRenderer.invoke('game-scanner:stop-periodic-scan')
  },

  async getPeriodicScanStatus(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }> {
    return await ipcRenderer.invoke('game-scanner:get-periodic-scan-status')
  },

  async requestProgress(): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:request-progress')
  },

  async ignoreFailedFolder(scannerId: string, folderPath: string): Promise<OverallScanProgress> {
    return await ipcRenderer.invoke('game-scanner:ignore-failed-folder', scannerId, folderPath)
  }
}
