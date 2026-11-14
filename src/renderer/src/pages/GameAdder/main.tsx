import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { BackgroundList } from './BackgroundList'
import { DuplicateReview } from '~/components/Game/DuplicateReview'
import { gameAdderFlow } from './flow'
import { Search } from './Search'
import { useGameAdderStore } from './store'

export function GameAdder(): React.JSX.Element {
  const { isOpen, currentPage, reviewIds, close } = useGameAdderStore()
  const { t } = useTranslation('adder')

  const renderPage = (): React.JSX.Element => {
    switch (currentPage) {
      case 'search':
        return <Search />
      case 'review':
        return <DuplicateReview gameIds={reviewIds} onConfirm={gameAdderFlow.confirmDuplicates} />
      case 'backgrounds':
        return <BackgroundList />
    }
  }

  return (
    <Dialog open={isOpen}>
      {isOpen && (
        <DialogContent
          className="flex h-auto w-auto max-w-none flex-col gap-5 outline-none"
          onClose={close}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            close()
          }}
        >
          {currentPage !== 'review' && (
            <DialogTitle className="sr-only">{t('gameAdder.dialog.title')}</DialogTitle>
          )}
          {renderPage()}
        </DialogContent>
      )}
    </Dialog>
  )
}
