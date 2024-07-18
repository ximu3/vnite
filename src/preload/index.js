import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { searchGameList, searchGameId, getScreenshotsByTitle, getCoverByTitle, organizeGameData } from "../renderer/src/components/scraper.mjs"
import { addNewGameToData } from "../renderer/src/data/dataManager.mjs"

// Custom APIs for renderer
const api = {
  searchGameList,
  searchGameId,
  getScreenshotsByTitle,
  getCoverByTitle,
  addNewGameToData,
  organizeGameData
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
  window.electron = electronAPI
  window.api = api
}
