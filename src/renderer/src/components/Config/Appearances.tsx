import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Switch } from '@ui/switch'
import { useConfigState } from '~/hooks'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'

export function Appearances(): JSX.Element {
  const { t } = useTranslation('config')

  const [showRecentGamesInGameList, setShowRecentGamesInGameList] = useConfigState(
    'game.gameList.showRecentGames'
  )
  const [showOriginalNameInGameHeader, setShowOriginalNameInGameHeader] = useConfigState(
    'game.gameHeader.showOriginalName'
  )
  const [showThemeSwitchInSidebar, setShowThemeSwitchInSidebar] = useConfigState(
    'appearances.sidebar.showThemeSwitcher'
  )
  const [highlightLocalGames, setHighlightLocalGames] = useConfigState(
    'game.gameList.highlightLocalGames'
  )
  const [markLocalGames, setMarkLocalGames] = useConfigState('game.gameList.markLocalGames')

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('appearances.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-8')}>
          {/* 游戏列表设置 */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.gameList.title')}</div>
            <div className={cn('flex flex-col gap-4 pl-2')}>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div>{t('appearances.gameList.showRecentGames')}</div>
                <Switch
                  checked={showRecentGamesInGameList}
                  onCheckedChange={(checked) => setShowRecentGamesInGameList(checked)}
                />
              </div>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div>{t('appearances.gameList.highlightLocalGames')}</div>
                <Switch
                  checked={highlightLocalGames}
                  onCheckedChange={(checked) => setHighlightLocalGames(checked)}
                />
              </div>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div>{t('appearances.gameList.markLocalGames')}</div>
                <Switch
                  checked={markLocalGames}
                  onCheckedChange={(checked) => setMarkLocalGames(checked)}
                />
              </div>
            </div>
          </div>

          {/* 游戏详情页设置 */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.gameDetail.title')}</div>
            <div className={cn('flex flex-col gap-4 pl-2')}>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div>{t('appearances.gameDetail.showOriginalName')}</div>
                <Switch
                  checked={showOriginalNameInGameHeader}
                  onCheckedChange={(checked) => setShowOriginalNameInGameHeader(checked)}
                />
              </div>
            </div>
          </div>

          {/* 侧边栏设置 */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.sidebar.title')}</div>
            <div className={cn('flex flex-col gap-4 pl-2')}>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div>{t('appearances.sidebar.showThemeSwitcher')}</div>
                <Switch
                  checked={showThemeSwitchInSidebar}
                  onCheckedChange={(checked) => setShowThemeSwitchInSidebar(checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
