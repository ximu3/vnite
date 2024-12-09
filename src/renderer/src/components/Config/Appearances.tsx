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
  const [showOriginalNameInGameHeader, setShowOriginalNameInGameHeader] = useDBSyncedState(
    false,
    'config.json',
    ['appearances', 'gameHeader', 'showOriginalNameInGameHeader']
  )
  return (
    <div className={cn('flex flex-col w-full h-full gap-5')}>
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
      <Card className={cn('group')}>
        <CardHeader>
          <CardTitle className={cn('relative')}>
            <div className={cn('flex flex-row justify-between items-center')}>
              <div className={cn('flex items-center')}>游戏详情</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('')}>
          <div className={cn('flex flex-col gap-5 justify-center')}>
            <div className={cn('flex flex-row justify-between items-center')}>
              <div>是否在游戏名称旁显示原名</div>
              <Switch
                checked={showOriginalNameInGameHeader}
                onCheckedChange={(checked) => setShowOriginalNameInGameHeader(checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
