import Screenshots from 'electron-screenshots'
import { Monitor, Window } from 'node-screenshots-new'
import { globalShortcut } from 'electron'
import { activeWindow, Result as ActiveWinResult } from 'get-windows'
import { ActiveGameInfo, addGameMemory } from '~/features/game'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import log from 'electron-log/main'
import path from 'path'
import { existsSync, createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { convertToWebP } from '~/utils'

let isScreenshotting = false
let hotkey = 'alt+shift+z'
let activeWin: ActiveWinResult | undefined
let screenshots: Screenshots | undefined

export async function setupScreenshotService(): Promise<void> {
  try {
    hotkey = await ConfigDBManager.getConfigLocalValue('hotkeys.capture')
    screenshots = new Screenshots()
    globalShortcut.register(hotkey, hotkeyCallback)

    // Click cancel button callback event
    screenshots.on('cancel', () => {
      isScreenshotting = false
      globalShortcut.unregister('esc')
    })
    // Click confirm button callback event
    screenshots.on('ok', (_e, buffer) => {
      captureToPersistenceLayer(activeWin, buffer)
      isScreenshotting = false
      globalShortcut.unregister('esc')
    })
    // Click save button callback event
    screenshots.on('save', (_e, buffer) => {
      captureToPersistenceLayer(activeWin, buffer)
      isScreenshotting = false
      globalShortcut.unregister('esc')
    })
    log.info('[System] Screenshot service initialized with hotkey:', hotkey)
  } catch (error) {
    log.error('[System] Error setting up screenshot service:', error)
    return
  }
}

export function updateScreenshotHotkey(newHotkey: string): void {
  try {
    if (hotkey === newHotkey) {
      return
    }
    // Unregister the old hotkey
    globalShortcut.unregister(hotkey)
    // Register the new hotkey
    hotkey = newHotkey
    globalShortcut.register(hotkey, hotkeyCallback)
  } catch (error) {
    log.error('[System] Error updating screenshot hotkey:', error)
    return
  }
}

async function hotkeyCallback(): Promise<void> {
  // Get the active window to determine the game memory context
  activeWin = await activeWindow()
  switch (await ConfigDBManager.getConfigValue('memory.snippingMode')) {
    case 'rectangle': {
      if (isScreenshotting) {
        console.warn('Screenshot service is already running')
        return
      }
      isScreenshotting = true
      screenshots?.startCapture()

      globalShortcut.register('esc', () => {
        if (screenshots?.$win?.isFocused()) {
          screenshots.endCapture()
          isScreenshotting = false
          globalShortcut.unregister('esc')
        }
      })
      return
    }
    case 'activewindow': {
      const buffer = await captureActiveWindow()
      if (!buffer) {
        console.warn('No active window for snipping')
        return
      }
      captureToPersistenceLayer(activeWin, buffer)
      return
    }
    case 'fullscreen': {
      const buffer = await captureFullScreen()
      if (!buffer) {
        console.warn('No screen for snipping')
        return
      }
      captureToPersistenceLayer(activeWin, buffer)
      return
    }
    default:
      return
  }
}

async function captureToPersistenceLayer(
  activeWin: ActiveWinResult | undefined,
  buffer: Buffer
): Promise<void> {
  const storageBackend = await ConfigDBManager.getConfigValue('memory.image.storageBackend')
  const shouldCaptureToDatabase = storageBackend !== 'filesystem'
  const shouldCaptureToFilesystem = storageBackend !== 'database'

  if (shouldCaptureToDatabase) {
    captureGameMemory(activeWin, buffer)
  }
  if (shouldCaptureToFilesystem) {
    captureToFileSystem(activeWin, buffer)
  }
}

async function captureGameMemory(
  activeWin: ActiveWinResult | undefined,
  buffer: Buffer
): Promise<void> {
  try {
    const activeGameInfos = ActiveGameInfo.infos
    if (activeGameInfos.length === 0) {
      console.warn('No active game found for memory capture')
      return
    }

    if (!activeWin) {
      await addGameMemory(activeGameInfos[0].gameId, buffer)
      log.warn('[System] No active window found, using first active game info for memory capture')
      return
    }

    const activeGame = ActiveGameInfo.getGameInfoByPid(activeWin.owner.processId)
    if (activeGame) {
      await addGameMemory(activeGame.gameId, buffer)
      log.info(`[System] Captured memory for game ${activeGame.gameId} from active window`)
    } else {
      await addGameMemory(activeGameInfos[0].gameId, buffer)
      log.warn(
        `[System] No matching game found for active window, using first active game info for memory capture`
      )
      return
    }
  } catch (error) {
    log.error('[System] Error capturing game memory:', error)
    return
  }
}

async function captureActiveWindow(): Promise<Buffer | undefined> {
  // retrieves an active window and do capturing
  for (const window of Window.all()) {
    if (window.isFocused()) {
      return (await window.captureImage()).toPng()
    }
  }
  // if no window is active, returns
  return
}

async function captureFullScreen(): Promise<Buffer | undefined> {
  // first, retrieves an active window
  for (const window of Window.all()) {
    if (window.isFocused()) {
      return (await window.currentMonitor().captureImage()).toPng()
    }
  }
  const monitors = Monitor.all()
  // if no window is active, captures primary screen
  for (const monitor of monitors) {
    if (monitor.isPrimary()) {
      return (await monitor.captureImage()).toPng()
    }
  }
  // if no screen is primary, captures the first one
  if (monitors.length > 0) {
    return (await monitors[0].captureImage()).toPng()
  }
  // if no screen, returns
  return
}

async function captureToFileSystem(
  activeWin: ActiveWinResult | undefined,
  buffer: Buffer
): Promise<void> {
  const activeGameInfos = ActiveGameInfo.infos
  if (activeGameInfos.length === 0) {
    console.warn('No active game found for capturing')
    return
  }
  const rootDir = await ConfigDBManager.getConfigValue('memory.image.saveDir')
  if (rootDir === '') {
    console.warn('Capturing root directory is empty')
    return
  }
  let gameId = activeGameInfos[0].gameId
  if (!activeWin) {
    log.warn('[System] No active window found, using first active game info for memory capture')
  } else {
    const activeGame = ActiveGameInfo.getGameInfoByPid(activeWin.owner.processId)
    if (activeGame) {
      gameId = activeGame.gameId
    } else {
      log.warn(
        '[System] No matching game found for active window, using first active game info for memory capture'
      )
    }
  }
  const game = await GameDBManager.getGame(gameId)
  const sanitizedName = game.metadata.name.replace(/[<>:"/\\|?*]/g, ' ')
  const saveDir = path.join(
    await ConfigDBManager.getConfigValue('memory.image.saveDir'),
    sanitizedName
  )
  if (!existsSync(saveDir)) {
    await mkdir(saveDir)
  }
  const fileName = (await ConfigDBManager.getConfigValue('memory.image.namingRule'))
    .replace(/[<>:"/\\|?*]/g, '')
    .replace('%name%', sanitizedName)
    .replace('%datetime%', getPathValidLocalTime())
    .replace('%timestamp%', Date.now().toString())
  const webpBuffer = await convertToWebP(buffer)
  const filePath = path.join(saveDir, `${fileName}.webp`)
  try {
    const writeStream = createWriteStream(filePath)
    writeStream.write(webpBuffer)
    writeStream.end()
    writeStream.on('finish', () => {
      log.info(`[System] Screenshot saved to: ${filePath}`)
    })
    writeStream.on('error', (error) => {
      log.error('[System] Error writing screenshot to filesystem:', error)
    })
  } catch (error) {
    log.error('[System] Error creating write stream for screenshot:', error)
  }
}

function getPathValidLocalTime(): string {
  const now = new Date()
  const datePart = now.toLocaleDateString('sv-SE')
  const timePart = now
    .toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    .replace(/:/g, '_')
  const ms = now.getMilliseconds().toString()
  return `${datePart} ${timePart}_${ms}`
}
