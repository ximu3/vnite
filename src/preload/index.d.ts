import { ElectronAPI } from '@electron-toolkit/preload'
import { DatabaseAPI } from '~/database'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      database: DatabaseAPI
    }
  }
}
