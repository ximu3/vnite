import { generateUUID } from '@appUtils'
import { app, BrowserWindow, ipcMain, OpenDialogOptions } from 'electron'
import {
  checkAdminPermissions,
  checkIfDirectoryNeedsAdminRights,
  createGameShortcut,
  getAppRootPath,
  getAppVersion,
  getLanguage,
  getTotalPathSize,
  openDatabasePathInExplorer,
  openPathInExplorer,
  portableStore,
  readFileBuffer,
  selectMultiplePathDialog,
  selectPathDialog,
  switchDatabaseMode,
  updateLanguage,
  updateOpenAtLogin
} from '~/utils'
import { trayManager } from '../index'

export function setupUtilsIPC(mainWindow: BrowserWindow): void {
  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('quit-to-tray', () => {
    mainWindow.hide()
  })

  ipcMain.on('restore-and-focus', () => {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.focus()
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
    async (
      _,
      properties: NonNullable<OpenDialogOptions['properties']>,
      extensions?: string[],
      defaultPath?: string
    ) => {
      return await selectPathDialog(properties, extensions, defaultPath)
    }
  )

  ipcMain.handle(
    'select-multiple-path-dialog',
    async (
      _,
      properties: NonNullable<OpenDialogOptions['properties']>,
      extensions?: string[],
      defaultPath?: string
    ) => {
      return await selectMultiplePathDialog(properties, extensions, defaultPath)
    }
  )

  ipcMain.handle('get-path-size', async (_, paths: string[]): Promise<number> => {
    return await getTotalPathSize(paths)
  })

  ipcMain.handle('open-path-in-explorer', async (_, filePath: string) => {
    await openPathInExplorer(filePath)
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

  ipcMain.handle('read-file-buffer', async (_, filePath: string) => {
    return await readFileBuffer(filePath)
  })

  ipcMain.handle('get-language', async () => {
    return getLanguage()
  })

  ipcMain.handle('check-admin-permissions', async () => {
    return await checkAdminPermissions()
  })

  ipcMain.handle('check-if-portable-directory-needs-admin-rights', async () => {
    return await checkIfDirectoryNeedsAdminRights(getAppRootPath())
  })

  ipcMain.handle('update-language', async (_, language: string) => {
    updateLanguage(language)
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized')
  })

  mainWindow.webContents.send('utilsIPCReady')
}
