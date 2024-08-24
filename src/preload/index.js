import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { searchGameList, searchGameId, getScreenshotsByTitle, getCoverByTitle, organizeGameData } from "../renderer/src/components/scraper.mjs"

// Custom APIs for renderer
const api = {
  searchGameList: withRetry(searchGameList, 3),
  searchGameId: withRetry(searchGameId, 3),
  getScreenshotsByTitle: withRetry(getScreenshotsByTitle, 3),
  getCoverByTitle: withRetry(getCoverByTitle, 3),
  organizeGameData: withRetry(organizeGameData, 3)
};

function withRetry(fn, retries = 3) {
  return async (...args) => {
    let attempts = retries;
    while (attempts > 0) {
      try {
        return await fn(...args);
      } catch (error) {
        attempts--;
        if (attempts === 0) {
          throw error;
        }
        log.error(`操作失败，1秒后重试。剩余重试次数：${attempts} ${error}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };
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
