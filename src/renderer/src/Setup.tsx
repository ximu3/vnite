import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { changeFontFamily, changeFontSize, changeFontWeight, navigateToGame, setup } from '~/utils'
import { ipcManager } from './app/ipc'
import { useConfigState } from './hooks'
import { useGameAdderStore } from './pages/GameAdder/store'
import { usePluginInfoStore } from './pages/Plugin/store'
import { randomGame } from './stores/game'

export function Setup(): React.JSX.Element {
  const router = useRouter()
  const [fontFamily] = useConfigState('appearances.fonts.family')
  const [fontSize] = useConfigState('appearances.fonts.size')
  const [fontWeight] = useConfigState('appearances.fonts.weight')
  const [scrollbarBlur] = useConfigState('appearances.scrollbar.blur')
  const [scrollbarOpacity] = useConfigState('appearances.scrollbar.opacity')
  useEffect(() => {
    setup(router)
  }, [])

  const [contentTopPadding] = useConfigState('appearances.gameDetail.contentTopPadding')
  const [headerImageMaxHeight] = useConfigState('appearances.gameDetail.headerImageMaxHeight')

  useEffect(() => {
    document.documentElement.style.setProperty('--content-top-padding', `${contentTopPadding}vh`)
    document.documentElement.style.setProperty('--header-max-height', `${headerImageMaxHeight}vh`)
    document.documentElement.style.setProperty('--scrollbar-blur', `${scrollbarBlur}px`)
    document.documentElement.style.setProperty('--scrollbar-opacity', scrollbarOpacity * 100 + '%')
  }, [contentTopPadding, headerImageMaxHeight, scrollbarBlur, scrollbarOpacity])

  useEffect(() => {
    usePluginInfoStore.getState().loadPlugins()
    usePluginInfoStore.getState().loadStats()
    usePluginInfoStore.getState().checkUpdates(true)
    ipcManager.on('plugin:update-all-plugins', (_event, plugins) => {
      usePluginInfoStore.getState().setPlugins(plugins)
    })
    ipcManager.on('plugin:update-plugin-stats', (_event, stats) => {
      usePluginInfoStore.getState().setStats(stats)
    })
  }, [])

  changeFontFamily(fontFamily)
  changeFontSize(fontSize)
  changeFontWeight(fontWeight)
  const [libraryHotkey] = useConfigState('hotkeys.library')
  const [recordHotkey] = useConfigState('hotkeys.record')
  const [scannerHotkey] = useConfigState('hotkeys.scanner')
  const [configHotkey] = useConfigState('hotkeys.config')
  const [goBackHotKey] = useConfigState('hotkeys.goBack')
  const [goForwardHotKey] = useConfigState('hotkeys.goForward')
  const [addGameHotkey] = useConfigState('hotkeys.addGame')
  const [randomGameHotkey] = useConfigState('hotkeys.randomGame')

  const setIsGameAdderOpen = useGameAdderStore((state) => state.setIsOpen)

  function randomGameDetail(): void {
    let randomGameId: string | null = null
    if (router.state.location.pathname.startsWith('/library/games/')) {
      const currentGameId = router.state.location.pathname.split('/')[3]
      randomGameId = randomGame(currentGameId)
    } else {
      randomGameId = randomGame()
    }

    if (randomGameId) {
      navigateToGame(router.navigate, randomGameId)
    } else {
      router.navigate({ to: '/library' })
    }
  }

  useHotkeys(
    addGameHotkey,
    () => {
      setIsGameAdderOpen(true)
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    libraryHotkey,
    () => {
      router.navigate({ to: '/library' })
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    recordHotkey,
    () => {
      router.navigate({ to: '/record' })
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    scannerHotkey,
    () => {
      router.navigate({ to: '/scanner' })
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    configHotkey,
    () => {
      router.navigate({ to: '/config' })
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    randomGameHotkey,
    () => {
      randomGameDetail()
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    goBackHotKey,
    () => {
      router.history.back()
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    goForwardHotKey,
    () => {
      router.history.forward()
    },
    {
      preventDefault: true
    }
  )
  return <></>
}
