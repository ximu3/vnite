import { Element, HTMLReactParserOptions } from 'html-react-parser'
import { toast } from 'sonner'
import { ipcSend, ipcInvoke } from '~/utils'
import { useRunningGames } from '~/pages/Library/store'
import { getGameLocalStore, getGameStore } from '~/stores/game'

export function copyWithToast(content: string): void {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success('已复制到剪切板', { duration: 1000 })
    })
    .catch((error) => {
      toast.error(`复制文本到剪切板失败: ${error}`)
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
      loading: '正在停止游戏...',
      success: '游戏已停止',
      error: (err) => `停止游戏失败: ${err.message}`
    }
  )
}

/**
 * 启动游戏的逻辑
 */
export async function startGame(gameId: string, navigate?: (path: string) => void): Promise<void> {
  // 导航到游戏详情页
  if (navigate) {
    navigate(`/library/games/${gameId}/all`)
  }

  // 获取最新的运行中游戏列表
  const { runningGames, setRunningGames } = useRunningGames.getState()

  const gameLocalStore = getGameLocalStore(gameId)
  const gameStore = getGameStore(gameId)
  const setGameLocalValue = gameLocalStore.getState().setValue
  const getGameLocalValue = gameLocalStore.getState().getValue
  const setGameValue = gameStore.getState().setValue
  const getGameValue = gameStore.getState().getValue
  if (getGameLocalValue('path.gamePath') === '') {
    toast.warning('请先设置游戏路径')
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    if (!filePath) {
      return
    }
    await setGameLocalValue('path.gamePath', filePath)
    // const isIconAccessible = await canAccessImageFile(gameId, 'icon')
    const isIconAccessible = await ipcInvoke('check-game-icon', gameId)
    if (!isIconAccessible) {
      await ipcInvoke('save-game-icon', gameId, filePath)
    }
    toast.promise(
      async () => {
        await ipcInvoke('launcher-preset', 'default', gameId)
      },
      {
        loading: '正在配置启动器...',
        success: '启动器配置成功',
        error: (error) => `${error}`
      }
    )
    return
  }

  const monitorMode = getGameLocalValue('monitor.mode')
  if (monitorMode === 'file') {
    const monitorConfig = getGameLocalValue('monitor.fileConfig')
    if (!monitorConfig.path) {
      toast.error('计时器配置错误，请检查！')
      return
    }
  } else if (monitorMode === 'folder') {
    const monitorConfig = getGameLocalValue('monitor.folderConfig')
    if (!monitorConfig.path) {
      toast.error('计时器配置错误，请检查！')
      return
    }
  } else {
    const monitorConfig = getGameLocalValue('monitor.processConfig')
    if (!monitorConfig.name) {
      toast.error('计时器配置错误，请检查！')
      return
    }
  }

  const launcherMode = getGameLocalValue('launcher.mode')

  // 根据不同模式验证配置
  if (launcherMode === 'file') {
    const launcherconfig = getGameLocalValue(`launcher.${launcherMode}Config`)
    if (launcherconfig.path && launcherconfig.workingDirectory) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
      if (getGameValue('record.playStatus') === 'unplayed') {
        setGameValue('record.playStatus', 'playing')
      }
    } else {
      toast.error('运行配置错误，请检查！')
    }
  } else if (launcherMode === 'script') {
    const launcherconfig = getGameLocalValue(`launcher.${launcherMode}Config`)
    if (launcherconfig.command && launcherconfig.workingDirectory) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
      if (getGameValue('record.playStatus') === 'unplayed') {
        setGameValue('record.playStatus', 'playing')
      }
    } else {
      toast.error('运行配置错误，请检查！')
    }
  } else if (launcherMode === 'url') {
    const launcherconfig = getGameLocalValue(`launcher.${launcherMode}Config`)
    if (launcherconfig.url) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
      if (getGameValue('record.playStatus') === 'unplayed') {
        setGameValue('record.playStatus', 'playing')
      }
    } else {
      toast.error('运行配置错误，请检查！')
    }
  } else {
    toast.error('运行配置错误，请检查！')
  }
}
