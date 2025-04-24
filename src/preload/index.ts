import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { webUtils } from 'electron'
import fse from 'fs-extra'
import path from 'path'

// Custom APIs for renderer
const api = {
  webUtils: {
    ...webUtils,
    isDirectory: (file: string): boolean => {
      try {
        return fse.lstatSync(file).isDirectory()
      } catch (_error) {
        return false
      }
    }
  },
  path: path
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
