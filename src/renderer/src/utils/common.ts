import { Element, HTMLReactParserOptions } from 'html-react-parser'
import i18next from 'i18next'
import { toast } from 'sonner'
import { useRunningGames } from '~/pages/Library/store'
import { getGameLocalStore, getGameStore } from '~/stores/game'
import { useConfigState } from '~/hooks'
import { ipcSend } from '~/utils'
import { generateUUID } from '@appUtils'
import { useNavigate } from 'react-router-dom'
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'

export function navigateToGame(
  navigate: ReturnType<typeof useNavigate>,
  gameId: string,
  groupId = 'all'
): void {
  const setLazyloadMark = usePositionButtonStore.getState().setLazyloadMark
  navigate(`/library/games/${gameId}/${encodeURIComponent(groupId)}`)
  scrollToElement({
    selector: `[data-game-id="${gameId}"][data-group-id="${groupId}"]`
  })
  setTimeout(() => {
    setLazyloadMark(generateUUID())
  }, 100)
}

export async function checkAttachment(
  dbName: string,
  docId: string,
  attachmentId: string
): Promise<boolean> {
  return await window.api.database.checkAttachment(dbName, docId, attachmentId)
}

export function copyWithToast(content: string): void {
  if (!content) return

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

/**
 * Scroll to a specific element on the page
 * @param options Scrolling options
 */
export function scrollToElement(options: {
  selector?: string
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
}): void {
  const { selector, behavior = 'instant', block = 'center' } = options

  // If there's no valid selector, return
  if (!selector) return

  // Find and scroll to the element
  const element = document.querySelector(selector)
  if (element) {
    element.scrollIntoView({
      behavior,
      block
    })
  }
}

export function stopGame(gameId: string): void {
  toast.promise(
    (async (): Promise<void> => {
      await window.api.launcher.stopGame(gameId)
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
   //Global variables used to know when to compress the metadata images
  const [imageTransformerStatus] = useConfigState('metadata.imageTransformer.enabled')
  const [imageTransformerQuality] = useConfigState('metadata.imageTransformer.quality')

  if (getGameLocalValue('path.gamePath') === '') {
    toast.warning(i18next.t('utils:game.starting.pathRequired'))
    const filePath: string = await window.api.utils.selectPathDialog(
      ['openFile'],
      undefined,
      getGameLocalValue('utils.markPath')
    )
    if (!filePath) {
      return
    }

    await setGameLocalValue('path.gamePath', filePath)

    async function isTypeAttachmentAccessible(dbName: string, gameId: string, type: string): Promise<boolean> {
      const attachments = await window.api.database.getAllAttachmentNames(dbName, gameId)
      return attachments.some(name => new RegExp(`^images/${type}\\.[^.]+$`, 'i').test(name))
    }

    const isIconAccessible = await isTypeAttachmentAccessible('game', gameId, 'icon')

    if (!isIconAccessible) {
      await window.api.media.saveGameIconByFile(gameId, filePath, imageTransformerStatus, imageTransformerQuality)
    }

    toast.promise(
      async () => {
        await window.api.launcher.launcherPreset('default', gameId)
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
