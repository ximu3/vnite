import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@ui/context-menu'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { getGameStore, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'

export function RecentGames(): JSX.Element {
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
              <AccordionTrigger className={cn('text-xs p-1 pl-2 bg-accent/35')}>
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
            {games.length === 0 && (
              <div className="flex items-center justify-center text-muted-foreground text-xs mt-3">
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
