import { ipcMain, BrowserWindow, OpenDialogOptions } from 'electron'
import { trayManager } from '../index'
import {
  generateUUID,
  selectPathDialog,
  selectMultiplePathDialog,
  openPathInExplorer,
  openGameDBPathInExplorer,
  createGameShortcut,
  openDatabasePathInExplorer,
  updateOpenAtLogin,
  getAppVersion,
  portableStore,
  switchDatabaseMode
} from '~/utils'
import { app } from 'electron'

export function setupUtilsIPC(mainWindow: BrowserWindow): void {
  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('close', () => {
    mainWindow.close()
  })

  ipcMain.on('relaunch-app', () => {
    app.relaunch()
    app.exit()
  })

  ipcMain.handle('generate-uuid', () => {
    return generateUUID()
  })

  ipcMain.handle(
    'select-path-dialog',
    async (_, properties: NonNullable<OpenDialogOptions['properties']>, extensions?: string[]) => {
      return await selectPathDialog(properties, extensions)
    }
  )

  ipcMain.handle(
    'select-multiple-path-dialog',
    async (_, properties: NonNullable<OpenDialogOptions['properties']>, extensions?: string[]) => {
      return await selectMultiplePathDialog(properties, extensions)
    }
  )

  ipcMain.handle('open-path-in-explorer', async (_, filePath: string) => {
    await openPathInExplorer(filePath)
  })

  ipcMain.handle('open-game-db-path-in-explorer', async (_, gameId: string) => {
    await openGameDBPathInExplorer(gameId)
  })

  ipcMain.handle('open-database-path-in-explorer', async () => {
    await openDatabasePathInExplorer()
  })

  ipcMain.handle('create-game-shortcut', async (_, gameId: string, targetPath: string) => {
    await createGameShortcut(gameId, targetPath)
  })

  ipcMain.handle('update-open-at-login', async () => {
    await updateOpenAtLogin()
  })

  ipcMain.handle('update-tray-config', async () => {
    await trayManager.updateConfig()
  })

  ipcMain.handle('get-app-version', async () => {
    return getAppVersion()
  })

  ipcMain.handle('is-portable-mode', async () => {
    return portableStore.isPortableMode
  })

  ipcMain.handle('switch-database-mode', async () => {
    return await switchDatabaseMode()
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized')
  })

  mainWindow.webContents.send('utilsIPCReady')
}
