import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Switch } from '@ui/switch'
import { useDBSyncedState } from '~/hooks'

export function Appearances(): JSX.Element {
  const [showRecentGamesInGameList, setShowRecentGamesInGameList] = useDBSyncedState(
    true,
    'config.json',
    ['appearances', 'gameList', 'showRecentGamesInGameList']
  )
  return (
    <div className={cn('flex flex-col w-full h-full')}>
      <Card className={cn('group')}>
        <CardHeader>
          <CardTitle className={cn('relative')}>
            <div className={cn('flex flex-row justify-between items-center')}>
              <div className={cn('flex items-center')}>游戏列表</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('')}>
          <div className={cn('flex flex-col gap-5 justify-center')}>
            <div className={cn('flex flex-row justify-between items-center')}>
              <div>是否显示最近游戏栏目</div>
              <Switch
                checked={showRecentGamesInGameList}
                onCheckedChange={(checked) => setShowRecentGamesInGameList(checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
