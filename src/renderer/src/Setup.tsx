import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from '@tanstack/react-router'
import { setup, changeFont } from '~/utils'
import { useGameAdderStore } from './pages/GameAdder/store'
import { randomGame } from './stores/game'
import { useConfigState } from './hooks'
import { useGameRegistry } from './stores/game'

export function Setup(): React.JSX.Element {
  const router = useRouter()
  const [font] = useConfigState('appearances.font')
  const gameIds = useGameRegistry((state) => state.gameIds)
  useEffect(() => {
    setup(router)
  }, [])

  changeFont(font)
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
