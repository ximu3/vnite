import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from '@tanstack/react-router'
import { setup, changeFontFamily, changeFontSize, changeFontWeight } from '~/utils'
import { useGameAdderStore } from './pages/GameAdder/store'
import { randomGame } from './stores/game'
import { useConfigState } from './hooks'
import { useGameRegistry } from './stores/game'
import { usePluginInfoStore } from './pages/Plugin/store'
import { ipcManager } from './app/ipc'

export function Setup(): React.JSX.Element {
  const router = useRouter()
  const [fontFamily] = useConfigState('appearances.fonts.family')
  const [fontSize] = useConfigState('appearances.fonts.size')
  const [fontWeight] = useConfigState('appearances.fonts.weight')
  const gameIds = useGameRegistry((state) => state.gameIds)
  useEffect(() => {
    setup(router)
  }, [])

  const [contentTopPadding] = useConfigState('appearances.gameDetail.contentTopPadding')
  const [headerImageMaxHeight] = useConfigState('appearances.gameDetail.headerImageMaxHeight')

  useEffect(() => {
    document.documentElement.style.setProperty('--content-top-padding', `${contentTopPadding}vh`)
    document.documentElement.style.setProperty('--header-max-height', `${headerImageMaxHeight}vh`)
  }, [contentTopPadding, headerImageMaxHeight])

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
    const randomGameId = randomGame()
    if (randomGameId) {
      if (router.state.location.pathname.startsWith('/library/games/')) {
        if (gameIds.length === 1) {
          return
        }
        const currentGameId = router.state.location.pathname.split('/')[3]
        if (currentGameId === randomGameId) {
          randomGameDetail()
          return
        }
      }
      router.navigate({ to: `/library/games/${randomGameId}/all` })
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
      // @ts-ignore - temporarily disable type check for `/record` route since it handles missing `search` parameter internally
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
      // @ts-ignore - temporarily disable type check for `/config` route since it handles missing `search` parameter internally
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
