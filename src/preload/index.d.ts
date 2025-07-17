import { ElectronAPI } from '@electron-toolkit/preload'
import { WebUtils } from 'electron'
import path from 'path'

export type WebUtilsExtended = WebUtils & {
  isDirectory: (path: string) => boolean
}

export * from './types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      webUtils: WebUtilsExtended
      path: typeof path
    }
  }
}
