import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { addNewGameToData, getGameData, updateGameData } from '../renderer/src/data/dataManager.mjs'
import { searchGameList, searchGameId, getScreenshotsByTitle, getCoverByTitle, organizeGameData } from "../renderer/src/components/scraper.mjs"
import { spawn } from 'child_process';

let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 770,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

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
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('close', () => app.quit())

ipcMain.on('minimize', () => {
  mainWindow.minimize();
})

ipcMain.on('maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.handle('open-file-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '可执行文件', extensions: ['exe'] }
    ]
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('open-file-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory'],
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.on('add-new-game-to-data', async (event, gid, coverUrl, bgUrl) => {
  await addNewGameToData(gid, coverUrl, bgUrl);
});

ipcMain.on('organize-game-data', async (event, gid, savePath, gamePath) => {
  await organizeGameData(gid, savePath, gamePath);
  gameData = await getGameData();
  mainWindow.webContents.send('game-data-organized', gameData);
});

ipcMain.handle('get-game-data', async (event) => {
  return await getGameData();
});

let processes = new Map();

ipcMain.on('start-game', (event, gamePath, gameId) => {
  const processId = gameId
  const startTime = Date.now();
  
  const exeProcess = spawn(gamePath);
  processes.set(processId, { process: exeProcess, startTime });

  exeProcess.on('error', (error) => {
    event.reply('game-start-result', { processId, success: false, error: error.message });
    processes.delete(processId);
  });

  exeProcess.on('exit', (code, signal) => {
    const endTime = Date.now();
    const runningTime = Math.floor((endTime - startTime) / 1000); // 转换为秒
    mainWindow.webContents.send('game-running-time', { processId, runningTime });
    processes.delete(processId);
  });

  event.reply('game-start-result', { processId, success: true });
});

app.on('will-quit', () => {
  for (let [id, { process }] of processes) {
    process.kill();
  }
});

