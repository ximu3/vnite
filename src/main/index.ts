import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell, protocol } from 'electron'
import log from 'electron-log/main'
import windowStateKeeper from 'electron-window-state'
import { join } from 'path'
import { baseDBManager, GameDBManager } from '~/core/database'
import { startSync } from '~/features/database'
import icon from '../../resources/icon.png?asset'
import { AuthManager, handleAuthCallback } from './features/account'
import { ipcManager, setupIPC } from './core/ipc'
import { setupAutoUpdater } from './features/updater'
import {
  checkAdminPermissions,
  checkIfDirectoryNeedsAdminRights,
  parseGameIdFromUrl,
  restartAppAsAdmin
} from './utils'
import {
  getAppRootPath,
  getDataPath,
  getLogsPath,
  setupTempDirectory,
  setupScreenshotService
} from '~/features/system'
import {
  TrayManager,
  setupTray,
  setupProtocols,
  setupOpenAtLogin,
  portableStore,
  initI18n,
  checkPortableMode,
  setupContextMenu,
  setupProxy
} from './features/system'
import { GameScannerManager } from './features/adder'
import { setupScraper } from './features/scraper'
import { cleanupPowerShell } from './utils'
import { pluginService } from './plugins'
import { net } from 'electron'
import { nativeCleanup, setupNativeModule } from './core/native'

export let mainWindow: BrowserWindow

export let trayManager: TrayManager

log.initialize()

global.fetch = net.fetch as typeof global.fetch

let launchGameId: string | null = null
const args = process.argv
const deepLinkUrl = args.find((arg) => arg.startsWith('vnite://'))
if (deepLinkUrl) {
  launchGameId = parseGameIdFromUrl(deepLinkUrl)
}

async function handleGameUrl(url: string): Promise<void> {
  try {
    const gameId = parseGameIdFromUrl(url)
    if (!gameId) {
      console.error('Invalid game URL format')
      return
    }

    console.log('Launching game with ID:', gameId)

    if (mainWindow) {
      // Make sure the window is visible
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()

      mainWindow.webContents.send('start-game-from-url', gameId)
    } else {
      launchGameId = gameId
    }
  } catch (error) {
    console.error('Error handling game URL:', error)
  }
}

function createWindow(): void {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1400,
    defaultHeight: 900,
    maximize: false,
    fullScreen: false
  })

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 770,
    minHeight: 420,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' || is.dev ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindowState.manage(mainWindow)

  setupIPC()

  mainWindow.once('ready-to-show', async () => {
    const isHidden = process.argv.includes('--hidden')
    if (!isHidden) {
      mainWindow.show()
    }
    if (launchGameId) {
      const gamePath = await GameDBManager.getGameLocalValue(launchGameId, 'path.gamePath')
      const mode = await GameDBManager.getGameLocalValue(launchGameId, 'launcher.mode')
      const config = await GameDBManager.getGameLocalValue(launchGameId, `launcher.${mode}Config`)
      mainWindow.webContents.send('start-game-from-url', launchGameId, gamePath, mode, config)
      launchGameId = null
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'attachment',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true
    }
  }
])

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('vnite')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Set the userData directory to a different location in development
  if (!app.isPackaged) {
    app.setPath('userData', join(getAppRootPath(), 'dev'))
  }

  log.transports.file.resolvePathFn = (): string => getLogsPath()

  log.info('[App] App is starting...')
  log.info(`[App] System: ${process.platform} ${process.arch}`)

  await checkPortableMode()

  // Check if the app is running in portable mode
  if (portableStore.isPortableMode) {
    if (await checkAdminPermissions()) {
      log.info('[App] Running in portable mode with admin permissions')
    } else {
      if (await checkIfDirectoryNeedsAdminRights(getDataPath())) {
        log.info(
          '[App] Running in portable mode without admin permissions, but needs admin permissions, restarting as admin'
        )
        restartAppAsAdmin()
        return
      } else {
        log.info('[App] Running in portable mode without admin permissions')
      }
    }
  } else {
    if (await checkAdminPermissions()) {
      log.info('[App] Running in normal mode with admin permissions')
    } else {
      log.info('[App] Running in normal mode without admin permissions')
    }
  }

  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    // If it's not the first instance, just exit
    app.quit()
    return
  }

  // Handling the startup of the second instance
  app.on('second-instance', (_event, commandLine) => {
    // If the main window exists, activate it
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()

      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }

      // Temporary placement to draw attention to
      mainWindow.setAlwaysOnTop(true)
      setTimeout(() => {
        mainWindow.setAlwaysOnTop(false)
      }, 300)
    }

    // Check for protocol URLs
    const url = commandLine.find((arg) => arg.startsWith('vnite://rungameid'))
    if (url) {
      // Processing Protocol URL
      handleGameUrl(url)
    }
    // Check for auth callback URLs specifically
    const authUrl = commandLine.find((arg) => arg.startsWith('vnite://auth/callback'))
    if (authUrl) {
      // Processing auth callback URL
      handleAuthCallback(authUrl)
    }
  })

  setupProtocols()

  // Setup scraper providers
  setupScraper()

  createWindow()

  baseDBManager.initAllDatabases()

  // Setup proxy config
  await setupProxy()

  try {
    AuthManager.init()
  } catch (error) {
    log.error('[Account] Failed to initialize AuthManager:', error)
  }

  try {
    AuthManager.updateUserInfo()
  } catch (_error) {
    ipcManager.send('account:update-user-info-error')
  }

  await initI18n()

  // Setup context menu
  await setupContextMenu()

  // Setup tray
  trayManager = await setupTray(mainWindow)

  // Setup temporary directory
  await setupTempDirectory()

  // Setup open at login
  setupOpenAtLogin()

  // Sync all databases with remote
  startSync()

  // Setup auto updater
  setupAutoUpdater()

  // Initialize the game scanner
  GameScannerManager.startScan()
  GameScannerManager.startPeriodicScan()

  pluginService.initialize()

  // Setup screenshot service
  setupScreenshotService()

  // Setup native module
  await setupNativeModule()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // trayManager.destroy()
    app.quit()
  }
})

// Add cleanup logic before application exit
app.on('before-quit', async () => {
  // Clean up PowerShell instance
  cleanupPowerShell()
  await nativeCleanup()

  // Clean up tray
  if (trayManager) {
    trayManager.destroy()
  }
})

// Add cleanup on process exit
process.on('exit', () => {
  cleanupPowerShell()
})

// Handle unexpected exits
process.on('SIGINT', async () => {
  cleanupPowerShell()
  await nativeCleanup()
  app.quit()
})

process.on('SIGTERM', async () => {
  cleanupPowerShell()
  await nativeCleanup()
  app.quit()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
