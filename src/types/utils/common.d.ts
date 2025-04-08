declare module 'eslint-plugin-react-hooks' {
  import type { ESLint } from 'eslint'

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLint.ConfigData>
  }

  export default plugin
}

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error'

interface ScannerProgress {
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

interface OverallScanProgress {
  status: ScanStatus
  currentScannerId: string
  processedScanners: number
  totalScanners: number
  scannersToProcess: string[]
  scannedGames: number
  errorMessage?: string
  scannerProgresses: Record<string, ScannerProgress>
}
