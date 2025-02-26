import { Separator } from '@ui/separator'
import React from 'react'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { InformationDialog } from './InformationDialog'

export function InformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [name] = useGameState(gameId, 'metadata.name')
  const [developers] = useGameState(gameId, 'metadata.developers')
  const [publishers] = useGameState(gameId, 'metadata.publishers')
  const [releaseDate] = useGameState(gameId, 'metadata.releaseDate')
  const [genres] = useGameState(gameId, 'metadata.genres')
  const [platforms] = useGameState(gameId, 'metadata.platforms')

  const handleCopySummary = (): void => {
    const titles = {
      originalName: '原名',
      name: '译名',
      developers: '开发商',
      publishers: '发行商',
      releaseDate: '发行日期',
      platforms: '平台',
      genres: '类型'
    }
    copyWithToast(
      Object.entries({
        originalName,
        name,
        developers,
        publishers,
        releaseDate,
        genres,
        platforms
      })
        .map(([key, value]) => `${titles[key]}: ${value}`)
        .join('\n')
    )
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none cursor-pointer')} onClick={handleCopySummary}>
          基本信息
        </div>
        <InformationDialog gameId={gameId} />
      </div>

      <Separator className={cn('my-3 bg-primary')} />

      <div className={cn('grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 text-sm')}>
        {/* original name */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(originalName)}
        >
          原名
        </div>
        <div>{originalName === '' ? '暂无' : originalName}</div>

        {/* name */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(name)}
        >
          译名
        </div>
        <div>{name === originalName || name === '' ? '暂无' : name}</div>

        {/* developers */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(developers.join(','))}
        >
          开发商
        </div>
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
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(publishers.join(','))}
        >
          发行商
        </div>
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
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(releaseDate)}
        >
          发行日期
        </div>
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
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(platforms.join(','))}
        >
          平台
        </div>
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
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(genres.join(','))}
        >
          类型
        </div>
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
