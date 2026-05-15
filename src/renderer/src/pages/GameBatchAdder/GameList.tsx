import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { UpscaleConfigControl } from '~/components/utils/UpscaleConfigControl'
import { GameListTable } from './GameListTable'
import { useGameAdder } from './hooks/useGameAdder'
import { useGameBatchAdderStore } from './store'

export function GameList(): React.JSX.Element {
  const { t } = useTranslation(['adder', 'game'])
  const { isLoading, enableUpscale, actions } = useGameBatchAdderStore()
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
        <div className="flex flex-row-reverse items-center gap-3 pt-[20px]">
          <Button disabled={isLoading} onClick={handleAddAll}>
            {isLoading ? t('gameBatchAdder.actions.adding') : t('gameBatchAdder.actions.addAll')}
          </Button>
          <UpscaleConfigControl
            checked={enableUpscale}
            onCheckedChange={actions.setEnableUpscale}
            label={t('game:detail.properties.media.actions.upscaleImage')}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
