import { Separator } from '@ui/separator'
import React from 'react'
import { toast } from 'sonner'
import { useDBSyncedState } from '~/hooks'
import { cn } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { InformationDialog } from './InformationDialog'

export function InformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [originalName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['originalName'])
  const [name] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [developers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['developers'])
  const [publishers] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['publishers'])
  const [releaseDate] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['releaseDate'])
  const [genres] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['genres'])
  const [platforms] = useDBSyncedState([''], `games/${gameId}/metadata.json`, ['platforms'])

  const handleCopy = (): void => {
    const titles = {
      originalName: '原名',
      name: '译名',
      developers: '开发商',
      publishers: '发行商',
      releaseDate: '发行日期',
      platforms: '平台',
      genres: '类型'
    }
    navigator.clipboard
      .writeText(
        `${Object.entries({
          originalName,
          name,
          developers,
          publishers,
          releaseDate,
          genres,
          platforms
        })
          .map(([key, value]) => `${titles[key]}: ${value}`)
          .join('\n')}`
      )
      .then(() => {
        toast.success('已复制到剪切板', { duration: 1000 })
      })
      .catch((error) => {
        toast.error(`复制文本到剪切板失败: ${error}`)
      })
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none cursor-pointer')} onClick={handleCopy}>
          基本信息
        </div>
        <InformationDialog gameId={gameId} />
      </div>

      <Separator className={cn('my-3 bg-primary')} />

      <div className={cn('grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 text-sm')}>
        {/* original name */}
        <div className={cn('whitespace-nowrap select-none')}>原名</div>
        <div>{originalName === '' ? '暂无' : originalName}</div>

        {/* name */}
        <div className={cn('whitespace-nowrap select-none')}>译名</div>
        <div>{name === originalName || name === '' ? '暂无' : name}</div>

        {/* developers */}
        <div className={cn('whitespace-nowrap select-none')}>开发商</div>
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
        <div className={cn('whitespace-nowrap select-none')}>发行商</div>
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
        <div className={cn('whitespace-nowrap select-none')}>发行日期</div>
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
        <div className={cn('whitespace-nowrap select-none')}>平台</div>
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
        <div className={cn('whitespace-nowrap select-none')}>类型</div>
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
