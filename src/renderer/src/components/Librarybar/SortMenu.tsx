import React from 'react'
import { useTranslation } from 'react-i18next'

import { GAME_SORT_FIELDS } from '@appTypes/models'
import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Separator } from '@ui/separator'
import { Switch } from '@ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import {
  GameSortFieldSelect,
  SecondarySortFields,
  SortDirectionButton
} from '~/components/Game/GameSortControl'
import { PlayStatusOrderEditor } from '~/components/Game/PlayStatusOrderEditor'
import { useConfigState } from '~/hooks'
import { useGameCollectionStore } from '~/stores'
import { filterGames, getAllValuesInKey, useVisibleGameIds } from '~/stores/game'
import { cn } from '~/utils'
import { useGameListStore, usePlayStatusOrderStore } from './store'

export function SortMenu({
  isSortMenuOpen,
  setIsSortMenuOpen,
  children
}: {
  isSortMenuOpen: boolean
  setIsSortMenuOpen: (open: boolean) => void
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [selectedGroup, setSelectedGroup] = useConfigState('game.gameList.selectedGroup')
  const [sort, setSort] = useConfigState('game.gameList.sort')
  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const [overrideCollectionSort, setOverrideCollectionSort] = useConfigState(
    'game.gameList.overrideCollectionSort'
  )
  const visibleGameIds = useVisibleGameIds()
  const collections = useGameCollectionStore((s) => s.documents)

  const { playStatusOrder, setPlayStatusOrder } = usePlayStatusOrderStore()

  const expandAllGroups = (): void => {
    let values: string[] = []

    if (selectedGroup === 'collection') {
      const visibleGameIdSet = new Set(visibleGameIds)
      const collectedGameIds = new Set<string>()
      values = Object.entries(collections)
        .filter(([, collection]) =>
          collection.games.some((gameId) => {
            if (!visibleGameIdSet.has(gameId)) return false
            collectedGameIds.add(gameId)
            return true
          })
        )
        .map(([collectionId]) => collectionId)

      if (visibleGameIds.some((gameId) => !collectedGameIds.has(gameId))) {
        values.push('__empty__')
      }
    } else if (selectedGroup === 'record.playStatus') {
      values = getAllValuesInKey('record.playStatus', visibleGameIds)
    } else if (selectedGroup === 'metadata.developers' || selectedGroup === 'metadata.genres') {
      const groupField = selectedGroup
      values = getAllValuesInKey(groupField, visibleGameIds)
      if (filterGames({ [groupField]: ['__empty__'] }, visibleGameIds).length > 0) {
        values.push('__empty__')
      }
    }

    // Exclude "Recent Games" and "All Games" from "Expand All".
    // The action is intended for browsing regular groups, meanwhile:
    // - "Recent Games" is already easily accessible at the top
    // - "All Games" mostly duplicates content from the individual groups.
    setOpenValues(selectedGroup, values)
  }

  return (
    <Popover open={isSortMenuOpen} onOpenChange={setIsSortMenuOpen}>
      <Tooltip>
        <PopoverTrigger>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="bottom">{t('librarybar.gameListSettings')}</TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom">
        <div className={cn('flex flex-col gap-5')}>
          {/* Sort By Select */}
          <div
            className={cn('grid grid-cols-[auto_minmax(0,1fr)_26px] gap-x-1 gap-y-5 items-center')}
          >
            <div className={cn('text-sm whitespace-nowrap')}>{t('showcase.sorting.label')}：</div>
            <GameSortFieldSelect
              value={sort.by}
              fields={GAME_SORT_FIELDS}
              triggerClassName={cn('w-full h-[26px] text-xs min-h-0')}
              onValueChange={(by) => {
                void setSort({
                  ...sort,
                  by,
                  secondary: sort.secondary?.by === by ? null : sort.secondary
                })
              }}
            />
            {/* Toggle Order Button */}
            <SortDirectionButton
              order={sort.order}
              className={cn('h-[26px] w-[26px]')}
              onOrderChange={(order) => {
                void setSort({ ...sort, order })
              }}
            />
            <div className={cn('text-sm whitespace-nowrap')}>
              {t('sortingControls.secondary')}：
            </div>
            <SecondarySortFields
              primaryBy={sort.by}
              value={sort.secondary}
              fields={GAME_SORT_FIELDS}
              layout="inline"
              onValueChange={(secondary) => {
                void setSort({ ...sort, secondary })
              }}
            />
          </div>

          {/* Group by select */}
          <div className={cn('flex flex-row gap-1 items-center justify-center')}>
            <div className={cn('text-sm whitespace-nowrap')}>{t('librarybar.groupBy')}：</div>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className={cn('flex-grow h-[26px] text-xs min-h-0')}>
                <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('librarybar.groups.none')}</SelectItem>
                <SelectItem value="collection">{t('librarybar.groups.collection')}</SelectItem>
                <SelectItem value="metadata.developers">
                  {t('librarybar.groups.developers')}
                </SelectItem>
                <SelectItem value="metadata.genres">{t('librarybar.groups.genres')}</SelectItem>
                <SelectItem value="record.playStatus">
                  {t('librarybar.groups.playStatus')}
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Quickly collapse/expand groups Button */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant={'thirdary'}
                  size={'icon'}
                  className={cn('h-[26px] w-[26px] ml-1')}
                  aria-label={t('librarybar.groupExpandCollapse')}
                  onClick={() => setOpenValues(selectedGroup, [])}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    expandAllGroups()
                  }}
                >
                  <span className={cn('icon-[mdi--animation-outline] w-4 h-4')}></span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="whitespace-pre-line text-center">
                {t('librarybar.groupExpandCollapse')}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Play Status Order */}
          {selectedGroup === 'record.playStatus' && (
            <>
              <Separator />
              <PlayStatusOrderEditor order={playStatusOrder} onOrderChange={setPlayStatusOrder} />
            </>
          )}

          {/* Collection settings */}
          {selectedGroup === 'collection' && (
            <>
              <Separator />
              <div className="flex flex-row gap-5 items-center justify-between">
                <div className="text-sm whitespace-nowrap">{t('list.overrideCollectionSort')}</div>
                <Switch
                  checked={overrideCollectionSort}
                  onCheckedChange={setOverrideCollectionSort}
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
