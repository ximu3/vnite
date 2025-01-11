import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { DateInput } from '@ui/date-input'
import { TooltipContent, TooltipTrigger, Tooltip } from '@ui/tooltip'
import { ArrayInput } from '@ui/array-input'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'

export function InformationDialog({ gameId }: { gameId: string }): JSX.Element {
  const [originalName, setOriginalName] = useDBSyncedState('', `games/${gameId}/metadata.json`, [
    'originalName'
  ])
  const [developers, setDevelopers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, [
    'developers'
  ])
  const [publishers, setPublishers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, [
    'publishers'
  ])
  const [releaseDate, setReleaseDate] = useDBSyncedState('', `games/${gameId}/metadata.json`, [
    'releaseDate'
  ])
  const [genres, setGenres] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['genres'])
  const [platforms, setPlatforms] = useDBSyncedState([''], `games/${gameId}/metadata.json`, [
    'platforms'
  ])
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
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={developers} onChange={setDevelopers} placeholder="暂无开发商" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>开发商之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('grow whitespace-nowrap')}>发行商</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={publishers} onChange={setPublishers} placeholder="暂无发行商" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>发行商之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
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
            <div className={cn('grow whitespace-nowrap')}>平台</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={platforms} onChange={setPlatforms} placeholder="暂无平台" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>平台之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('whitespace-nowrap')}>类型</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={genres} onChange={setGenres} placeholder="暂无类型" />
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
