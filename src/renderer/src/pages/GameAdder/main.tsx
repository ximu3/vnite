import { cn } from '~/utils'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useGameAdderStore, initializeStore } from './store'
import { useEffect } from 'react'
import { useConfigState } from '~/hooks'
import { Search } from './Search'
import { GameList } from './GameList'
import { BackgroundList } from './BackgroundList'

function GameAdderContent(): React.JSX.Element {
  const { isOpen, currentPage, handleClose } = useGameAdderStore()
  const [defaultDataSource] = useConfigState('game.scraper.common.defaultDataSource')

  useEffect(() => {
    const initStore = async (): Promise<void> => {
      initializeStore(defaultDataSource)
    }
    initStore()
  }, [defaultDataSource])

  const renderCurrentPage = (): React.JSX.Element => {
    switch (currentPage) {
      case 'search':
        return <Search />
      case 'games':
        return <GameList />
      case 'screenshots':
        return <BackgroundList />
      default:
        return <Search />
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className={cn('w-auto h-auto max-w-none flex flex-col gap-5 outline-none')}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
        onClose={() => {
          handleClose()
        }}
      >
        {renderCurrentPage()}
      </DialogContent>
    </Dialog>
  )
}

export function GameAdder(): React.JSX.Element {
  return <GameAdderContent />
}
