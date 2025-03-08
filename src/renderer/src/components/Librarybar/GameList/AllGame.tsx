import { cn } from '~/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { Button } from '@ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { ContextMenuContent, ContextMenuTrigger, ContextMenu } from '@ui/context-menu'
import { useConfigState } from '~/hooks'
import { sortGames } from '~/stores/game'
import { GameNav } from '../GameNav'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useTranslation } from 'react-i18next'

function PlaceHolder(): JSX.Element {
  return <div className={cn('p-3 h-5 rounded-none bg-transparent')}></div>
}

// 将组件拆分为内部组件和导出组件
export function AllGameComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): JSX.Element {
  const [by, setBy] = useConfigState('game.gameList.sort.by')
  const [order, setOrder] = useConfigState('game.gameList.sort.order')
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }
  const games = sortGames(by, order)
  const { t } = useTranslation('game')

  return (
    <AccordionItem value="all">
      <ContextMenu>
        <ContextMenuTrigger className={cn('rounded-none')}>
          <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
            <div className={cn('flex flex-row items-center justify-start gap-1')}>
              <div className={cn('text-xs')}>{t('list.all.title')}</div>
              <div className={cn('text-2xs text-foreground/50')}>({games.length})</div>
            </div>
          </AccordionTrigger>
        </ContextMenuTrigger>
        <ContextMenuContent className={cn('w-full p-3')}>
          <div className={cn('flex flex-row gap-5 items-center justify-center')}>
            <div className={cn('flex flex-row gap-1 items-center justify-center')}>
              <div className={cn('text-sm whitespace-nowrap')}>{t('list.all.sortBy')}：</div>
              <Select value={by} onValueChange={setBy} defaultValue="name">
                <SelectTrigger className={cn('w-[120px] h-[26px] text-xs')}>
                  <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t('list.all.sortBy')}：</SelectLabel>
                    <SelectItem value="metadata.name">{t('list.all.sortOptions.name')}</SelectItem>
                    <SelectItem value="metadata.releaseDate">
                      {t('list.all.sortOptions.releaseDate')}
                    </SelectItem>
                    <SelectItem value="record.lastRunDate">
                      {t('list.all.sortOptions.lastRunDate')}
                    </SelectItem>
                    <SelectItem value="record.addDate">
                      {t('list.all.sortOptions.addDate')}
                    </SelectItem>
                    <SelectItem value="record.playTime">
                      {t('list.all.sortOptions.playTime')}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={'outline'}
              size={'icon'}
              className={cn('h-[26px] w-[26px] -ml-3')}
              onClick={toggleOrder}
            >
              {order === 'asc' ? (
                <span className={cn('icon-[mdi--arrow-up] w-4 h-4')}></span>
              ) : (
                <span className={cn('icon-[mdi--arrow-down] w-4 h-4')}></span>
              )}
            </Button>
          </div>
        </ContextMenuContent>
      </ContextMenu>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        {games.map((gameId) => (
          <LazyLoadComponent
            key={gameId}
            threshold={300}
            scrollPosition={scrollPosition}
            placeholder={<PlaceHolder />}
          >
            <GameNav gameId={gameId} groupId="all" scrollPosition={scrollPosition} />
          </LazyLoadComponent>
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

// 使用trackWindowScroll高阶组件包装内部组件
export const AllGame = trackWindowScroll(AllGameComponent)
