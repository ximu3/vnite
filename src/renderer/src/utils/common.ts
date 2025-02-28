import { Element, HTMLReactParserOptions } from 'html-react-parser'
import { toast } from 'sonner'
import { ipcSend } from '~/utils'
import { useRunningGames } from '~/pages/Library/store'

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

/**
 * 启动游戏的逻辑
 */
export async function startGame(
  gameId: string,
  gamePath: string,
  mode: string,
  config: any,
  navigate: (path: string) => void
): Promise<void> {
  // 导航到游戏详情页
  navigate(`/library/games/${gameId}/all`)

  // 获取最新的运行中游戏列表
  const { runningGames, setRunningGames } = useRunningGames.getState()

  if (gamePath === '') {
    toast.warning('请先设置游戏路径')
    return
  }

  // 根据不同模式验证配置
  if (mode === 'file') {
    if (config.path && config.workingDirectory && config.timerPath && config.timerMode) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
    } else {
      toast.error('运行配置错误，请检查！')
    }
  } else if (mode === 'script') {
    if (config.command && config.workingDirectory && config.timerPath && config.timerMode) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
    } else {
      toast.error('运行配置错误，请检查！')
    }
  } else if (mode === 'url') {
    if (config.url) {
      ipcSend('start-game', gameId)
      setRunningGames([...runningGames, gameId])
    } else {
      toast.error('运行配置错误，请检查！')
    }
  } else {
    toast.error('运行配置错误，请检查！')
  }
}
