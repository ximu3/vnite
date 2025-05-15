import { cn } from '~/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import {
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenu,
  ContextMenuItem
} from '@ui/context-menu'
import { useConfigState } from '~/hooks'
import { sortGames } from '~/stores/game'
import { GameNav } from '../GameNav'
import { useTranslation } from 'react-i18next'

export function RecentGames(): JSX.Element {
  const [showRecentGamesInGameList, setShowRecentGamesInGameList] = useConfigState(
    'game.gameList.showRecentGames'
  )
  const games = sortGames('record.lastRunDate', 'desc').slice(0, 5)
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
            {games.map((gameId) => (
              <GameNav key={gameId} gameId={gameId} groupId="recentGames" />
            ))}
          </AccordionContent>
        </AccordionItem>
      )}
    </>
  )
}
