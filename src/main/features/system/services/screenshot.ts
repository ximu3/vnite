import Screenshots from 'electron-screenshots'
import { globalShortcut } from 'electron'
import { activeWindow, Result as ActiveWinResult } from 'get-windows'
import { ActiveGameInfo, addGameMemory } from '~/features/game'
import { ConfigDBManager } from '~/core/database'
import log from 'electron-log/main'

let isScreenshotting = false
let hotkey = 'alt+shift+z'
let activeWin: ActiveWinResult | undefined
let screenshots: Screenshots | undefined

export async function setupScreenshotService(): Promise<void> {
  try {
    hotkey = await ConfigDBManager.getConfigLocalValue('hotkeys.capture')
    screenshots = new Screenshots()
    globalShortcut.register(hotkey, async () => {
      if (isScreenshotting) {
        console.warn('Screenshot service is already running')
        return
      }
      isScreenshotting = true
      // Get the active window to determine the game memory context
      activeWin = await activeWindow()

      screenshots?.startCapture()

      globalShortcut.register('esc', () => {
        if (screenshots?.$win?.isFocused()) {
          screenshots.endCapture()
          isScreenshotting = false
          globalShortcut.unregister('esc')
        }
      })
    })

    // Click cancel button callback event
    screenshots.on('cancel', () => {
      isScreenshotting = false
      globalShortcut.unregister('esc')
    })
    // Click confirm button callback event
    screenshots.on('ok', (_e, buffer) => {
      captureGameMemory(activeWin, buffer)
      isScreenshotting = false
      globalShortcut.unregister('esc')
    })
    // Click save button callback event
    screenshots.on('save', (_e, buffer) => {
      captureGameMemory(activeWin, buffer)
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
    globalShortcut.register(hotkey, async () => {
      if (isScreenshotting) {
        console.warn('Screenshot service is already running')
        return
      }
      isScreenshotting = true
      // Get the active window to determine the game memory context
      activeWin = await activeWindow()

      screenshots?.startCapture()

      globalShortcut.register('esc', () => {
        if (screenshots?.$win?.isFocused()) {
          screenshots.endCapture()
          globalShortcut.unregister('esc')
        }
      })
    })
  } catch (error) {
    log.error('[System] Error updating screenshot hotkey:', error)
    return
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
