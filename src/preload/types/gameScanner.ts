import { OverallScanProgress } from '@appTypes/utils'

export interface GameScannerAPI {
  scanAll(): Promise<OverallScanProgress>
  scanScanner(scannerId: string): Promise<OverallScanProgress>
  stopScan(): Promise<OverallScanProgress>
  getProgress(): Promise<OverallScanProgress>
  fixFolder(folderPath: string, gameId: string, dataSource: string): Promise<OverallScanProgress>
  startPeriodicScan(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }>
  stopPeriodicScan(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }>
  getPeriodicScanStatus(): Promise<{
    active: boolean
    lastScanTime: number
    autoStart: boolean
    interval: number | null
  }>
  requestProgress(): Promise<OverallScanProgress>
  ignoreFailedFolder(scannerId: string, folderPath: string): Promise<OverallScanProgress>
}
