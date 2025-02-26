import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { useConfigState } from '~/hooks'

export function Scraper(): JSX.Element {
  const [defaultDataSource, setDefaultDataSource] = useConfigState(
    'game.scraper.defaultDatasSource'
  )
  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>刮削器</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 justify-center')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('grow')}>默认数据源</div>
            <Select value={defaultDataSource} onValueChange={setDefaultDataSource}>
              <SelectTrigger className={cn('w-[200px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>默认数据源</SelectLabel>
                  <SelectItem value="steam">Steam</SelectItem>
                  <SelectItem value="vndb">VNDB</SelectItem>
                  <SelectItem value="bangumi">Bangumi</SelectItem>
                  <SelectItem value="igdb">IGDB</SelectItem>
                  <SelectItem value="ymgal">YMgal</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
