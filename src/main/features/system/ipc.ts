import { generateUUID } from '@appUtils'
import { app, OpenDialogOptions } from 'electron'
import { ipcManager } from '~/core/ipc'
import { mainWindow } from '~/index'
import {
  checkAdminPermissions,
  checkIfDirectoryNeedsAdminRights,
  cropImage,
  downloadTempImage,
  getAppVersion,
  getTotalPathSize,
  openDatabasePathInExplorer,
  openPathInExplorer,
  readFileBuffer,
  saveClipboardImage,
  selectMultiplePathDialog,
  selectPathDialog
} from '~/utils'
import {
  copyAppLogInCurrentLifetimeToClipboardAsFile,
  createGameShortcut,
  getAppLogContentsInCurrentLifetime,
  getAppRootPath,
  getLanguage,
  getSystemFonts,
  openLogPathInExplorer,
  portableStore,
  saveGameIconByFile,
  switchDatabaseMode,
  updateLanguage,
  updateOpenAtLogin,
  updateScreenshotHotkey
} from './services'
import { setupNativeMonitor, stopNativeMonitor } from '~/features/monitor'

export function setupSystemIPC(): void {
  ipcManager.on('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcManager.on('window:quit-to-tray', () => {
    mainWindow.hide()
  })

  ipcManager.on('window:restore-and-focus', () => {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.focus()
  })

  ipcManager.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcManager.on('window:close', () => {
    mainWindow.close()
  })

  ipcManager.on('app:relaunch-app', () => {
    app.relaunch()
    app.exit()
  })

  ipcManager.handle('utils:generate-uuid', () => {
    return generateUUID()
  })

  ipcManager.handle('utils:get-app-log-contents-in-current-lifetime', async () => {
    return await getAppLogContentsInCurrentLifetime()
  })

  ipcManager.handle('utils:copy-app-log-in-current-lifetime-to-clipboard-as-file', async () => {
    await copyAppLogInCurrentLifetimeToClipboardAsFile()
  })

  ipcManager.handle('utils:open-log-path-in-explorer', async () => {
    await openLogPathInExplorer()
  })

  ipcManager.handle(
    'system:select-path-dialog',
    async (
      _,
      properties: NonNullable<OpenDialogOptions['properties']>,
      extensions?: string[],
      defaultPath?: string
    ) => {
      return await selectPathDialog(properties, extensions, defaultPath)
    }
  )

  ipcManager.handle(
    'system:select-multiple-path-dialog',
    async (
      _,
      properties: NonNullable<OpenDialogOptions['properties']>,
      extensions?: string[],
      defaultPath?: string
    ) => {
      return await selectMultiplePathDialog(properties, extensions, defaultPath)
    }
  )

  ipcManager.handle('system:get-fonts', async () => {
    return await getSystemFonts()
  })

  ipcManager.handle('system:get-path-size', async (_, paths: string[]): Promise<number> => {
    return await getTotalPathSize(paths)
  })

  ipcManager.handle('system:open-path-in-explorer', async (_, filePath: string) => {
    await openPathInExplorer(filePath)
  })

  ipcManager.handle('utils:open-database-path-in-explorer', async () => {
    await openDatabasePathInExplorer()
  })

  ipcManager.handle('utils:create-game-shortcut', async (_, gameId: string, targetPath: string) => {
    await createGameShortcut(gameId, targetPath)
  })

  ipcManager.handle('utils:update-open-at-login', async () => {
    await updateOpenAtLogin()
  })

  ipcManager.handle('app:get-app-version', async () => {
    return getAppVersion()
  })

  ipcManager.handle('app:is-portable-mode', async () => {
    return portableStore.isPortableMode
  })

  ipcManager.handle('app:switch-database-mode', async () => {
    return await switchDatabaseMode()
  })

  ipcManager.handle('system:read-file-buffer', async (_, filePath: string) => {
    return await readFileBuffer(filePath)
  })

  ipcManager.handle('system:get-language', async () => {
    return getLanguage()
  })

  ipcManager.handle('system:check-admin-permissions', async () => {
    return await checkAdminPermissions()
  })

  ipcManager.handle('system:check-if-portable-directory-needs-admin-rights', async () => {
    return await checkIfDirectoryNeedsAdminRights(getAppRootPath())
  })

  ipcManager.handle('app:update-language', async (_, language: string) => {
    await updateLanguage(language)
  })

  ipcManager.handle(
    'utils:crop-image',
    async (
      _,
      {
        sourcePath,
        x,
        y,
        width,
        height
      }: {
        sourcePath: string
        x: number
        y: number
        width: number
        height: number
      }
    ) => {
      return await cropImage({ sourcePath, x, y, width, height })
    }
  )

  ipcManager.handle('utils:save-game-icon-by-file', async (_, gameId: string, filePath: string) => {
    return await saveGameIconByFile(gameId, filePath)
  })

  ipcManager.handle('utils:download-temp-image', async (_, url: string) => {
    return await downloadTempImage(url)
  })

  ipcManager.handle('utils:save-clipboard-image', async () => {
    return await saveClipboardImage()
  })

  ipcManager.handle('system:update-screenshot-hotkey', (_, hotkey: string) => {
    return updateScreenshotHotkey(hotkey)
  })

  mainWindow.on('maximize', () => {
    ipcManager.send('window:maximized')
  })

  mainWindow.on('unmaximize', () => {
    ipcManager.send('window:unmaximized')
  })

  ipcManager.on('system:change-process-monitor', async (_, monitor: 'new' | 'legacy') => {
    if (monitor === 'new') {
      await setupNativeMonitor()
    } else if (monitor === 'legacy') {
      await stopNativeMonitor()
    }
  })
}
