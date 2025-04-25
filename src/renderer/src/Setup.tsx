import { useNavigate } from 'react-router-dom'
import { setup } from '~/utils'
import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useGameAdderStore } from './pages/GameAdder/store'
import { randomGame } from './stores/game'
import { useConfigState } from './hooks'

export function Setup(): JSX.Element {
  const navigate = useNavigate()
  useEffect(() => {
    setup(navigate)
  }, [])

  const [libraryHotkey] = useConfigState('hotkeys.library')
  const [recordHotkey] = useConfigState('hotkeys.record')
  const [scannerHotkey] = useConfigState('hotkeys.scanner')
  const [configHotkey] = useConfigState('hotkeys.config')
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
  return <></>
}
