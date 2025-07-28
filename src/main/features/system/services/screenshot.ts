import Screenshots from 'electron-screenshots'
import { globalShortcut } from 'electron'
import { activeWindow, Result as ActiveWinResult } from 'get-windows'
import { ActiveGameInfo, addGameMemory } from '~/features/game'
import { ConfigDBManager } from '~/core/database'
import log from 'electron-log/main'

let isScreenshotting = false
let hotkey = 'alt+shift+z'
let activeWin: ActiveWinResult | undefined

export async function setupScreenshotService(): Promise<void> {
  hotkey = await ConfigDBManager.getConfigLocalValue('hotkeys.capture')
  const screenshots = new Screenshots()
  globalShortcut.register(hotkey, async () => {
    if (isScreenshotting) {
      console.warn('Screenshot service is already running')
      return
    }
    isScreenshotting = true
    // Get the active window to determine the game memory context
    activeWin = await activeWindow()

    screenshots.startCapture()
  })

  globalShortcut.register('esc', () => {
    if (screenshots.$win?.isFocused()) {
      screenshots.endCapture()
    }
  })
  // Click cancel button callback event
  screenshots.on('cancel', () => {
    isScreenshotting = false
  })
  // Click confirm button callback event
  screenshots.on('ok', (_e, buffer) => {
    captureGameMemory(activeWin, buffer)
    isScreenshotting = false
  })
  // Click save button callback event
  screenshots.on('save', (_e, buffer) => {
    captureGameMemory(activeWin, buffer)
    isScreenshotting = false
  })
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
