import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { DateInput } from '@ui/date-input'
import { TooltipContent, TooltipTrigger, Tooltip } from '@ui/tooltip'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { ChangeEvent } from 'react'

export function InformationDialog({ index }: { index: string }): JSX.Element {
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
  const handleGenresChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
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
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('flex flex-col gap-5')}>
        <div className={cn('flex flex-col gap-3 p-4')}>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>原名</div>
            <Input
              value={originalName}
              onChange={(e) => setOriginalName(e.target.value)}
              placeholder="暂无原名"
              className={cn(' text-sm')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>开发商</div>
            <Input
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="暂无开发商"
              className={cn(' text-sm')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>发行商</div>
            <Input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="暂无发行商"
              className={cn(' text-sm')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('whitespace-nowrap')}>发行日期</div>
            <DateInput
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="暂无发行日期"
              className={cn('text-sm grow')}
            />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>类型</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <Input
                  value={genres.join(', ')}
                  onChange={handleGenresChange}
                  placeholder="暂无类型"
                  className={cn('')}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>类型之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
