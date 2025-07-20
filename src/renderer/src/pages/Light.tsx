// Light.tsx 修改版
import { useEffect, useState, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useConfigState, useGameState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
import { sortGames, useGameCollectionStore } from '~/stores/game'
import { CrossfadeImage } from '@ui/cross-fade-image'
import { cn } from '~/utils'
import { useTheme } from '~/components/ThemeProvider'
import { create } from 'zustand'

// eslint-disable-next-line
export const useLightStore = create<{
  refreshId: number
  refresh: () => void
}>((set) => ({
  refreshId: 0,
  refresh: () => set((state) => ({ refreshId: state.refreshId + 1 }))
}))

export function Light(): React.JSX.Element {
  const { pathname } = useLocation()
  const [gameId, setGameId] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [scrollY, setScrollY] = useState(0)
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const getGameCollectionValue = useGameCollectionStore((state) => state.getGameCollectionValue)
  const collections = useGameCollectionStore((state) => state.documents)
  const [customBackground] = useConfigState('appearances.background.customBackground')
  const [darkGlassBlur] = useConfigState('appearances.glass.dark.blur')
  const [darkGlassOpacity] = useConfigState('appearances.glass.dark.opacity')
  const [lightGlassBlur] = useConfigState('appearances.glass.light.blur')
  const [lightGlassOpacity] = useConfigState('appearances.glass.light.opacity')
  const [glassBlur, setGlassBlur] = useState(darkGlassBlur)
  const [glassOpacity, setGlassOpacity] = useState(darkGlassOpacity)
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const detailBackgroundRef = useRef<HTMLDivElement>(null)
  const { isDark } = useTheme()
  const refreshId = useLightStore((state) => state.refreshId)

  useEffect(() => {
    // 根据主题设置玻璃效果的模糊和透明度
    if (isDark) {
      setGlassBlur(darkGlassBlur)
      setGlassOpacity(darkGlassOpacity)
    } else {
      setGlassBlur(lightGlassBlur)
      setGlassOpacity(lightGlassOpacity)
    }
  }, [isDark, darkGlassBlur, darkGlassOpacity, lightGlassBlur, lightGlassOpacity])

  // 获取游戏背景URL
  const getGameBackgroundUrl = (id: string): string => {
    const info = getAttachmentInfo('game', id, 'images/background.webp')
    return `attachment://game/${id}/images/background.webp?t=${info?.timestamp}`
  }

  // 获取自定义背景URL
  const getCustomBackgroundUrl = (): string => {
    const info = getAttachmentInfo(
      'config',
      'media',
      `background-${isDark ? 'dark' : 'light'}.webp`
    )
    return `attachment://config/media/background-${isDark ? 'dark' : 'light'}.webp?t=${info?.timestamp}`
  }

  // 检查自定义背景是否可用
  const isCustomBackgroundAvailable = (): boolean => {
    return (
      customBackground &&
      !getAttachmentInfo('config', 'media', `background-${isDark ? 'dark' : 'light'}.webp`)?.error
    )
  }

  // 获取最近游戏ID
  const getRecentGameId = (): string => sortGames('record.lastRunDate', 'desc')[0]

  // 设置新背景图像URL
  const updateBackgroundImage = (newUrl: string, newGameId: string = ''): void => {
    if (newUrl === imageUrl) return

    setImageUrl(newUrl)
    if (newGameId) setGameId(newGameId)
  }

  // 处理滚动事件
  useEffect(() => {
    const handleScroll = (e: Event): void => {
      // 获取滚动元素
      const scrollElement = e.target as HTMLElement

      // 计算滚动位置，限制最小为0（防止向上滚动超出）
      const currentScrollY = Math.max(0, scrollElement.scrollTop)
      setScrollY(currentScrollY)
    }

    // 监听自定义事件
    const handleGameScroll = (e: CustomEvent): void => {
      const currentScrollY = e.detail?.scrollY || 0
      setScrollY(currentScrollY)
    }

    // 添加滚动事件监听
    window.addEventListener('game-scroll', handleGameScroll as EventListener)

    // 对文档添加滚动监听
    document.addEventListener('scroll', handleScroll)

    // 对所有标记为可滚动内容的元素添加监听
    document.querySelectorAll('.scrollable-content').forEach((el) => {
      el.addEventListener('scroll', handleScroll)
    })

    return (): void => {
      window.removeEventListener('game-scroll', handleGameScroll as EventListener)
      document.removeEventListener('scroll', handleScroll)
      document.querySelectorAll('.scrollable-content').forEach((el) => {
        el.removeEventListener('scroll', handleScroll)
      })
    }
  }, [])

  // 当路径更改时更新背景
  useEffect(() => {
    if (pathname.includes('/library/games/')) {
      const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
      updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
    } else if (pathname.includes('/library/collections')) {
      const currentCollectionId = pathname.split('/collections/')[1]?.split('/')[0]

      if (!currentCollectionId) {
        if (isCustomBackgroundAvailable()) {
          updateBackgroundImage(getCustomBackgroundUrl())
        } else {
          const recentGameId = getRecentGameId()
          updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)
        }
        return
      }

      const currentGameId = getGameCollectionValue(currentCollectionId, 'games')[0]
      if (currentGameId) {
        updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
      }
    } else {
      if (isCustomBackgroundAvailable()) {
        updateBackgroundImage(getCustomBackgroundUrl())
        return
      }

      const recentGameId = getRecentGameId()
      updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)
    }
  }, [pathname, getGameCollectionValue, collections, customBackground, isDark, refreshId])

  // 更新CSS变量
  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity * 100 + '%')
    document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`)
  }, [glassOpacity, glassBlur])

  // 检查是否显示游戏详情页面背景
  const isGameDetailRoute = pathname.includes('/library/games/') && gameId !== ''

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
      {/* 游戏详情页面专用背景层 - 仅在games路由显示 */}
      {isGameDetailRoute && (
        <div
          ref={detailBackgroundRef}
          className={cn('absolute overflow-hidden', 'will-change-transform')}
          style={{
            left: '324px',
            top: '50px',
            width: 'calc(100% - 324px)',
            height: 'calc(100% - 50px)',
            zIndex: 15,
            clipPath: 'inset(0 0 0 0)' // 确保内容不会溢出这个容器
          }}
        >
          {/* 内部容器用于实现视差滚动效果 */}
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `translateY(-${scrollY * 0.4}px)`,
              maskImage: 'linear-gradient(to bottom, black 30%, transparent 70%)'
            }}
          >
            <CrossfadeImage
              src={imageUrl}
              className={cn('w-full h-auto max-h-[55vh] object-top object-cover')}
              blur={enableNSFWBlur && nsfw}
              duration={500}
              onError={() => {
                if (customBackground) {
                  setAttachmentError('config', 'media', 'background.webp', true)
                } else {
                  setAttachmentError('game', gameId, 'images/background.webp', true)
                }
              }}
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            />
            {/* <GameImage
              gameId={gameId}
              key={`${gameId}-background-detail`}
              type="background"
              blur={enableNSFWBlur}
              className={cn('w-full h-auto max-h-[55vh] object-top object-cover')}
              fallback={<div className={cn('w-full h-full bg-background/15')} />}
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            /> */}
          </div>
        </div>
      )}

      {/* 玻璃效果层 */}
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-full bg-background/[var(--glass-opacity)] backdrop-filter backdrop-blur-[var(--glass-blur)] z-10'
        )}
      ></div>

      {/* 背景图层 */}
      <CrossfadeImage
        src={imageUrl}
        className="w-full h-full"
        duration={500}
        onError={() => {
          if (customBackground) {
            setAttachmentError('config', 'media', 'background.webp', true)
          } else {
            setAttachmentError('game', gameId, 'images/background.webp', true)
          }
        }}
      />
    </div>
  )
}
