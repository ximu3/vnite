import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'
import { setup } from '~/utils'
import { useConfigState } from './hooks'
import { useGameAdderStore } from './pages/GameAdder/store'
import { randomGame } from './stores/game'

export function Setup(): JSX.Element {
  const navigate = useNavigate()
  useEffect(() => {
    setup(navigate)
  }, [])

  const [libraryHotkey] = useConfigState('hotkeys.library')
  const [recordHotkey] = useConfigState('hotkeys.record')
  const [scannerHotkey] = useConfigState('hotkeys.scanner')
  const [configHotkey] = useConfigState('hotkeys.config')
  const [goBackHotKey] = useConfigState('hotkeys.goBack')
  const [goForwardHotKey] = useConfigState('hotkeys.goForward')
  const [addGameHotkey] = useConfigState('hotkeys.addGame')
  const [randomGameHotkey] = useConfigState('hotkeys.randomGame')

  const setIsGameAdderOpen = useGameAdderStore((state) => state.setIsOpen)

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
      navigate('/library')
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    recordHotkey,
    () => {
      navigate('/record')
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    scannerHotkey,
    () => {
      navigate('/scanner')
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    configHotkey,
    () => {
      navigate('/config')
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    randomGameHotkey,
    () => {
      const randomGameId = randomGame()
      if (randomGameId) {
        navigate(`/library/games/${randomGameId}/all`)
      } else {
        navigate('/library')
      }
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    goBackHotKey,
    () => {
      navigate(-1)
    },
    {
      preventDefault: true
    }
  )
  useHotkeys(
    goForwardHotKey,
    () => {
      navigate(1)
    },
    {
      preventDefault: true
    }
  )
  return <></>
}
