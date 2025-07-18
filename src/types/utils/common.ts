export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error'

export interface ScannerProgress {
  status: ScanStatus
  processedFolders: number
  totalFolders: number
  currentFolder: string
  foldersToProcess: string[]
  failedFolders: {
    path: string
    name: string
    error: string
    dataSource: string
  }[]
  scannedGames: number
  errorMessage?: string
}

export interface OverallScanProgress {
  status: ScanStatus
  currentScannerId: string
  processedScanners: number
  totalScanners: number
  scannersToProcess: string[]
  scannedGames: number
  errorMessage?: string
  scannerProgresses: Record<string, ScannerProgress>
}
