import { Element, HTMLReactParserOptions } from 'html-react-parser'
import { toast } from 'sonner'
import { ipcSend, ipcInvoke } from '~/utils'
import { useRunningGames } from '~/pages/Library/store'
import { getGameLocalStore, getGameStore } from '~/stores/game'
import i18next from 'i18next'

export function copyWithToast(content: string): void {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success(i18next.t('utils:clipboard.copied'), { duration: 1000 })
    })
    .catch((error) => {
      toast.error(i18next.t('utils:clipboard.copyError', { error }))
    })
}

export const HTMLParserOptions: HTMLReactParserOptions = {
  replace: (domNode) => {
    if (domNode instanceof Element && domNode.name === 'a') {
      // Make sure the link opens in a new tab
      domNode.attribs.target = '_blank'
      // Add rel="noopener noreferrer" for added security
      domNode.attribs.rel = 'noopener noreferrer'
    }
  }
}

export function stopGame(gameId: string): void {
  toast.promise(
    (async (): Promise<void> => {
      await ipcInvoke(`stop-game-${gameId}`)
    })(),
    {
      loading: i18next.t('utils:game.stopping.loading'),
      success: i18next.t('utils:game.stopping.success'),
      error: (err) => i18next.t('utils:game.stopping.error', { message: err.message })
    }
  )
}

/**
 * Logic for starting the game
 */
export async function startGame(gameId: string, navigate?: (path: string) => void): Promise<void> {
  // Navigate to the game details page
  if (navigate) {
    navigate(`/library/games/${gameId}/all`)
  }

  // Get the latest list of running games
  const { runningGames, setRunningGames } = useRunningGames.getState()

  const gameLocalStore = getGameLocalStore(gameId)
  const gameStore = getGameStore(gameId)
  const setGameLocalValue = gameLocalStore.getState().setValue
  const getGameLocalValue = gameLocalStore.getState().getValue
  const setGameValue = gameStore.getState().setValue
  const getGameValue = gameStore.getState().getValue

  if (getGameLocalValue('path.gamePath') === '') {
    toast.warning(i18next.t('utils:game.starting.pathRequired'))
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    if (!filePath) {
      return
    }

    await setGameLocalValue('path.gamePath', filePath)

    const isIconAccessible = await ipcInvoke(
      'db-check-attachment',
      'game',
      gameId,
      'images/icon.webp'
    )
    if (!isIconAccessible) {
      await ipcInvoke('save-game-icon-by-file', gameId, filePath)
    }

    toast.promise(
      async () => {
        await ipcInvoke('launcher-preset', 'default', gameId)
      },
      {
        loading: i18next.t('utils:game.starting.configuringLauncher'),
        success: i18next.t('utils:game.starting.configSuccess'),
        error: (error) => i18next.t('utils:game.starting.configError', { message: error })
      }
    )
    return
  }

  const launcherMode = getGameLocalValue('launcher.mode')

  // Validating configurations against different modes
  if (launcherMode === 'file') {
    const launcherConfig = getGameLocalValue(`launcher.${launcherMode}Config`)
    if (
      launcherConfig.path &&
      launcherConfig.workingDirectory &&
      launcherConfig.monitorMode &&
      launcherConfig.monitorPath
    ) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
      if (getGameValue('record.playStatus') === 'unplayed') {
        setGameValue('record.playStatus', 'playing')
      }
    } else {
      toast.error(i18next.t('utils:game.starting.runtimeError'))
    }
  } else if (launcherMode === 'script') {
    const launcherConfig = getGameLocalValue(`launcher.${launcherMode}Config`)
    if (
      launcherConfig.command &&
      launcherConfig.workingDirectory &&
      launcherConfig.monitorMode &&
      launcherConfig.monitorPath
    ) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
      if (getGameValue('record.playStatus') === 'unplayed') {
        setGameValue('record.playStatus', 'playing')
      }
    } else {
      toast.error(i18next.t('utils:game.starting.runtimeError'))
    }
  } else if (launcherMode === 'url') {
    const launcherConfig = getGameLocalValue(`launcher.${launcherMode}Config`)
    if (launcherConfig.url && launcherConfig.monitorMode && launcherConfig.monitorPath) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
      if (getGameValue('record.playStatus') === 'unplayed') {
        setGameValue('record.playStatus', 'playing')
      }
    } else {
      toast.error(i18next.t('utils:game.starting.runtimeError'))
    }
  } else {
    toast.error(i18next.t('utils:game.starting.runtimeError'))
  }
}
