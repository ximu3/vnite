import { useNavigate } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { ScrollArea } from '@ui/scroll-area'
import { isEqual } from 'lodash'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { useGameScannerStore } from '~/pages/GameScannerManager/store'
import { useGameRegistry } from '~/stores/game'
import { cn } from '~/utils'
import { useFilterStore } from '../Librarybar/Filter/store'
import { useLibrarybarStore } from '../Librarybar/store'
import { AllGames } from './AllGames'
import { Collections } from './Collections'
import { FilterSearchGames } from './FilterSearchGames'
import { RecentGames } from './RecentGames'
import { ScrollToTopButton } from './ScrollToTopButton'

export function Showcase(): React.JSX.Element {
  const query = useLibrarybarStore((state) => state.query)
  const { filter } = useFilterStore()

  const { t } = useTranslation('game')
  const gameIds = useGameRegistry((state) => state.gameIds)
  const setEditingScanner = useGameScannerStore((state) => state.setEditingScanner)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const selectGames = useGameBatchEditorStore((state) => state.selectGames)
  const navigate = useNavigate()

  let MainContent: React.JSX.Element
  if (!isEqual(filter, {})) {
    MainContent = <FilterSearchGames mode={'filter'} />
  } else if (query && query.trim() !== '') {
    MainContent = <FilterSearchGames mode={'search'} />
  } else {
    MainContent = (
      <>
        <RecentGames />
        <Collections />
        <AllGames />
      </>
    )
  }

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Check if any dialog element is active
      const isDialogActive =
        document.querySelector('dialog[open]') !== null ||
        document.querySelector('.modal.active') !== null ||
        document.querySelector('[role="dialog"]') !== null

      // When a dialog is open, do not execute shortcut key functions
      if (isDialogActive) {
        return
      }

      // Ctrl + A select all games
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        selectGames(gameIds)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectGames, gameIds])

  return (
    <div className={cn('flex flex-col gap-3 h-full w-full bg-transparent')}>
      {gameIds.length !== 0 ? (
        <>
          <ScrollArea ref={scrollAreaRef} className={cn('w-full h-full')}>
            <div className={cn('pt-[18px] flex flex-col gap-3')}>{MainContent}</div>
          </ScrollArea>
          <ScrollToTopButton scrollAreaRef={scrollAreaRef} />
        </>
      ) : (
        // Show Welcome Message
        <div className={cn('flex flex-col gap-1 items-center justify-center w-full h-full -mt-7')}>
          <div>
            <span className={cn('icon-[mdi--gamepad-variant] w-[60px] h-[60px]')}></span>
          </div>
          <div className={cn('text-2xl font-bold -mt-2')}>{t('showcase.welcome')}</div>
          <Button
            variant={'outline'}
            className={cn('mt-4')}
            onClick={() => {
              navigate({ to: '/scanner' })
              setEditingScanner({
                id: null,
                isNew: true
              })
            }}
            size={'icon'}
          >
            <span className={cn('icon-[mdi--plus] w-5 h-5')}></span>
          </Button>
        </div>
      )}
    </div>
  )
}
