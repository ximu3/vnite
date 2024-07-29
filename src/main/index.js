import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { addNewGameToData, getGameData, updateGameData } from '../renderer/src/data/dataManager.mjs'
import { organizeGameData } from "../renderer/src/components/scraper.mjs"
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs/promises';
import fse from 'fs-extra';
import { getConfigData, updateConfigData } from '../renderer/src/config/configManager.mjs';
import { startAuthProcess, initializeRepo } from '../renderer/src/components/cloudSync.mjs';

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

ipcMain.handle('open-img-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif'] }
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
    console.log(`Game ${processId} exited. Running time: ${runningTime} seconds`);
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

ipcMain.on('update-game-data', async (event, newData) => {
  await updateGameData(newData);
  mainWindow.webContents.send('game-data-updated', newData);
})

ipcMain.on('save-game-data', async (event, data) => {
  await updateGameData(data);
})

ipcMain.on('open-folder', async (event, path) => {
  shell.openPath(join(app.getAppPath(), path));
  console.log(join(app.getAppPath(), path));
})

ipcMain.handle('update-game-cover', async (event, gameId, imgPath) => {
  try {
    const coverDir = join(app.getAppPath(), `src/renderer/public/${gameId}/`);
    const coverPath = join(coverDir, 'cover.webp');

    // 确保目标文件夹存在
    await fs.mkdir(coverDir, { recursive: true });

    // 处理图片：只转换为WebP格式，不改变分辨率
    await sharp(imgPath)
      .webp({ quality: 100 })  // 可以根据需要调整质量
      .toFile(coverPath);

    return coverPath;
  } catch (error) {
    console.error('更新游戏封面时出错:', error);
    throw error; // 将错误传回渲染进程
  }
});

ipcMain.handle('update-game-background', async (event, gameId, imgPath) => {
  try {
    const bgDir = join(app.getAppPath(), `src/renderer/public/${gameId}/`);
    const bgPath = join(bgDir, 'background.webp');

    // 确保目标文件夹存在
    await fs.mkdir(bgDir, { recursive: true });

    // 处理图片：只转换为WebP格式，不改变分辨率
    await sharp(imgPath)
      .webp({ quality: 100 })  // 可以根据需要调整质量
      .toFile(bgPath);

    return bgPath;
  } catch (error) {
    console.error('更新游戏背景时出错:', error);
    throw error; // 将错误传回渲染进程
  }
})

ipcMain.handle('copy-save', async (event, savePath, gameId, saveId) => {
  const saveDir = join(app.getAppPath(), `src/renderer/public/${gameId}/saves/${saveId}/`);
  try {
    // 首先确保目标目录存在
    await fse.ensureDir(saveDir);

    // 清空目标目录
    await fse.emptyDir(saveDir);

    // 然后复制文件
    await fse.copy(savePath, saveDir, { overwrite: true });

  } catch (error) {
    console.error('复制存档时出错:', error);
  }
});

ipcMain.on('delete-save', async (event, gameId, saveId) => {
  const saveDir = join(app.getAppPath(), `src/renderer/public/${gameId}/saves/${saveId}/`);
  try {
    await fse.remove(saveDir);
    event.reply('delete-save-reply', 'success');
  } catch (error) {
    console.error('删除存档时出错:', error);
    event.reply('delete-save-reply', 'error', error.message);
  }
})

ipcMain.on('switch-save', async (event, gameId, saveId, realSavePath) => {
  const savePath = join(app.getAppPath(), `src/renderer/public/${gameId}/saves/${saveId}/`);
  try {
    await fse.move(savePath, realSavePath, { overwrite: true });
    event.reply('switch-save-reply', 'success');
  } catch (error) {
    console.error('切换存档时出错:', error);
    event.reply('switch-save-reply', 'error', error.message);
  }
})

ipcMain.on('save-memory-img', async (event, gameId, imgId, imgPath) => {
  const imgDir = join(app.getAppPath(), `src/renderer/public/${gameId}/memories/`);
  const webpFileName = `${imgId}.webp`; // 使用imgId作为文件名
  const webpFilePath = join(imgDir, webpFileName);

  try {
    // 确保目标文件夹存在
    await fse.ensureDir(imgDir);

    // 使用sharp读取原图片，转换为WebP格式，然后保存
    await sharp(imgPath)
      .webp({ quality: 100 }) // 设置WebP质量，范围0-100
      .toFile(webpFilePath);

    console.log(`图片已保存为WebP格式：${webpFilePath}`);
  } catch (error) {
    console.error('保存记忆图片时出错:', error);
  }
});

ipcMain.handle('get-config-data', async (event) => {
  return await getConfigData();
});

ipcMain.handle('update-config-data', async (event, newData) => {
  await updateConfigData(newData);
});

ipcMain.on('save-config-data', async (event, data) => {
  await updateConfigData(data);
})

ipcMain.handle('start-auth-process', async (event, clientId, clientSecret) => {
  try {
    const result = await startAuthProcess(mainWindow, clientId, clientSecret);
    return result;
  } catch (error) {
    console.error('Authentication process failed:', error);
    throw error; // 这将把错误传回渲染进程
  }
});

ipcMain.handle('initialize-repo', async (event, token, owner) => {
  try {
    const path = join(app.getAppPath(), 'src/renderer/public/');
    return await initializeRepo(token, owner, path);
  } catch (error) {
    console.error('Error initializing repository:', error);
    mainWindow.webContents.send('initialize-error', error.message);
    throw error;
  }
});