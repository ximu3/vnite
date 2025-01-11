import { Separator } from '@ui/separator'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { InformationDialog } from './InformationDialog'
import { FilterAdder } from '../../FilterAdder'
import React from 'react'

export function InformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [originalName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['originalName'])
  const [developers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['developers'])
  const [publishers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['publishers'])
  const [releaseDate] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['releaseDate'])
  const [genres] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['genres'])
  const [platforms] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['platforms'])

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold')}>基本信息</div>
        <InformationDialog gameId={gameId} />
      </div>

      <Separator className={cn('my-3 bg-primary')} />

      <div className={cn('grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 text-sm')}>
        {/* original name */}
        <div className={cn('whitespace-nowrap')}>原名</div>
        <div>{originalName === '' ? '暂无' : originalName}</div>

        {/* developers */}
        <div className={cn('whitespace-nowrap')}>开发商</div>
        <div
          className={cn(
            'flex flex-wrap gap-x-1 gap-y-[6px]',
            developers.join(',') !== '' && 'mt-[2px]'
          )}
        >
          {developers.join(',') === ''
            ? '暂无'
            : developers.map((developer) => (
                <React.Fragment key={developer}>
                  <FilterAdder filed="developers" value={developer} className={cn('')} />
                </React.Fragment>
              ))}
        </div>

        {/* publishers */}
        <div className={cn('whitespace-nowrap')}>发行商</div>
        <div
          className={cn(
            'flex flex-wrap gap-x-1 gap-y-1',
            publishers.join(',') !== '' && 'mt-[2px]'
          )}
        >
          {publishers.join(',') === ''
            ? '暂无'
            : publishers.map((publisher) => (
                <React.Fragment key={publisher}>
                  <FilterAdder filed="publishers" value={publisher} className={cn('')} />
                </React.Fragment>
              ))}
        </div>

        {/* releaseDate */}
        <div className={cn('whitespace-nowrap')}>发行日期</div>
        <div className={cn('flex flex-wrap gap-x-1 gap-y-1', releaseDate !== '' && 'mt-[2px]')}>
          {releaseDate === '' ? (
            '暂无'
          ) : (
            <FilterAdder
              filed="releaseDate"
              className={cn('hover:no-underline')}
              value={releaseDate}
            />
          )}
        </div>

        {/* platforms */}
        <div className={cn('whitespace-nowrap')}>平台</div>
        <div
          className={cn('flex flex-wrap gap-x-1 gap-y-1', platforms.join(',') !== '' && 'mt-[2px]')}
        >
          {platforms.join(',') === ''
            ? '暂无'
            : platforms.map((platform) => (
                <React.Fragment key={platform}>
                  <FilterAdder filed="platforms" value={platform} />
                </React.Fragment>
              ))}
        </div>

        {/* genres */}
        <div className={cn('whitespace-nowrap')}>类型</div>
        <div
          className={cn('flex flex-wrap gap-x-1 gap-y-1', genres.join(',') !== '' && 'mt-[2px]')}
        >
          {genres.join(',') === ''
            ? '暂无'
            : genres.map((genre) => (
                <React.Fragment key={genre}>
                  <FilterAdder filed="genres" value={genre} />
                </React.Fragment>
              ))}
        </div>
      </div>
    </div>
  )
}
