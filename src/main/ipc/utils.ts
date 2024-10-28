import { ipcMain, BrowserWindow, OpenDialogOptions } from 'electron'
import { generateUUID, selectPathDialog, selectMultiplePathDialog } from '~/utils'

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

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized')
  })

  mainWindow.webContents.send('utilsIPCReady')
}
