import { useGameBatchAdderStore } from './store'
import { GameListTable } from './GameListTable'
import { useGameAdder } from './hooks/useGameAdder'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function GameList(): React.JSX.Element {
  const { t } = useTranslation('adder')
  const { isLoading } = useGameBatchAdderStore()
  const { addAllGames } = useGameAdder()

  const handleAddAll = (): void => {
    toast.promise(addAllGames, {
      loading: t('gameBatchAdder.notifications.addingGames'),
      success: t('gameBatchAdder.notifications.gamesAdded'),
      error: t('gameBatchAdder.notifications.gameAddFailed')
    })
  }

  return (
    <div className="w-[70vw] h-[70vh]">
      <div className="py-[10px] w-full">
        <GameListTable />
        <div className="flex flex-row-reverse pt-[20px]">
          <Button disabled={isLoading} onClick={handleAddAll}>
            {isLoading ? t('gameBatchAdder.actions.adding') : t('gameBatchAdder.actions.addAll')}
          </Button>
        </div>
      </div>
    </div>
  )
}
