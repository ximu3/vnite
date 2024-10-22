import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { TooltipContent, TooltipTrigger, Tooltip } from '@ui/tooltip'

export function InformationCard({
  index,
  className = ''
}: {
  index: string
  className?: string
}): JSX.Element {
  const [originalName, setOriginalName] = useDBSyncedState('', `games/${index}/metadata.json`, [
    'originalName'
  ])
  const [developer, setDeveloper] = useDBSyncedState('', `games/${index}/metadata.json`, [
    'developer'
  ])
  const [publisher, setPublisher] = useDBSyncedState('', `games/${index}/metadata.json`, [
    'publisher'
  ])
  const [releaseDate, setReleaseDate] = useDBSyncedState('', `games/${index}/metadata.json`, [
    'releaseDate'
  ])
  const [genres, setGenres] = useDBSyncedState([''], `games/${index}/metadata.json`, ['genres'])
  const handleGenresChange = (value: string): void => {
    const endsWithComma = value.endsWith(',')

    const newGenres = value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '')

    const uniqueGenres = [...new Set(newGenres)]

    if (endsWithComma && newGenres[newGenres.length - 1] !== '') {
      uniqueGenres.push('')
    }

    setGenres(uniqueGenres)
  }
  return (
    <Card className={cn(className, 'group')}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('pb-1')}>基本信息</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-2 text-sm')}>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>原名</div>
            <Input
              value={originalName}
              onChange={(e) => setOriginalName(e.target.value)}
              variant="ghost"
              placeholder="暂无原名"
              className={cn('min-w-0 h-[24px] px-[6px] text-xs')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>开发商</div>
            <Input
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              variant="ghost"
              placeholder="暂无开发商"
              className={cn('min-w-0 h-[24px] px-[6px] text-xs')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>发行商</div>
            <Input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              variant="ghost"
              placeholder="暂无发行商"
              className={cn('min-w-0 h-[24px] px-[6px] text-xs')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>发行日期</div>
            <Input
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              variant="ghost"
              placeholder="暂无发行日期"
              className={cn('min-w-0 h-[24px] px-[6px] text-xs')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>类型</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <Input
                  value={genres.join(', ')}
                  onChange={(e) => handleGenresChange(e.target.value)}
                  variant="ghost"
                  placeholder="暂无类型"
                  className={cn('min-w-0 h-[24px] px-[6px] text-xs')}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className={cn('text-xs')}>类型之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
