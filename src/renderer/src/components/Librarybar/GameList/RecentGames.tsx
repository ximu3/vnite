import { AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '~/components/ui/context-menu'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { getGameStore, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'

export function RecentGames(): React.JSX.Element {
  const [showRecentGamesInGameList, setShowRecentGamesInGameList] = useConfigState(
    'game.gameList.showRecentGames'
  )
  const games = sortGames('record.lastRunDate', 'desc')
    .slice(0, 5)
    .filter((id) => {
      const date = getGameStore(id).getState().getValue('record.lastRunDate')
      return date && date !== ''
    })
  const { t } = useTranslation('game')
  return (
    <>
      {showRecentGamesInGameList && (
        <AccordionItem value="recentGames">
          <ContextMenu>
            <ContextMenuTrigger>
              <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
                <div className={cn('flex flex-row items-center justify-start gap-1')}>
                  <div className={cn('text-xs')}>{t('list.recent.title')}</div>
                </div>
              </AccordionTrigger>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => setShowRecentGamesInGameList(false)}>
                {t('list.recent.hide')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
            {/* If there are no recent games, show a message */}
            {games.length === 0 && (
              <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
                {t('list.recent.empty')}
              </div>
            )}
            {games.map((gameId) => (
              <GameNav key={gameId} gameId={gameId} groupId="recentGames" />
            ))}
          </AccordionContent>
        </AccordionItem>
      )}
    </>
  )
}
