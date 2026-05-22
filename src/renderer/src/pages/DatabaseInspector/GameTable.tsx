import { useNavigate } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { OverviewGameStorageSummary } from '@appTypes/models'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { cn, formatStorageSize } from '~/utils'

type OverviewSortKey = 'name' | 'total' | 'attachments' | 'count' | 'save'

type SortDirection = 'asc' | 'desc'

function getDefaultSortDirection(sortKey: OverviewSortKey): SortDirection {
  return sortKey === 'name' ? 'asc' : 'desc'
}

function compareGamesForTable(
  a: OverviewGameStorageSummary,
  b: OverviewGameStorageSummary,
  sortKey: OverviewSortKey
): number {
  switch (sortKey) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'attachments':
      return b.attachmentBytes - a.attachmentBytes || a.name.localeCompare(b.name)
    case 'count':
      return b.attachmentCount - a.attachmentCount || a.name.localeCompare(b.name)
    case 'save':
      return (
        b.attachmentCategoryBytes.save - a.attachmentCategoryBytes.save ||
        a.name.localeCompare(b.name)
      )
    case 'total':
    default:
      return b.totalLogicalPayloadBytes - a.totalLogicalPayloadBytes || a.name.localeCompare(b.name)
  }
}

function SortableTableHead({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort
}: {
  label: string
  sortKey: OverviewSortKey
  currentSortKey: OverviewSortKey
  direction: SortDirection
  onSort: (sortKey: OverviewSortKey) => void
}): React.JSX.Element {
  const isActive = currentSortKey === sortKey
  const icon = !isActive ? (
    <ArrowUpDown className="w-3.5 h-3.5" />
  ) : direction === 'asc' ? (
    <ArrowUp className="w-3.5 h-3.5" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5" />
  )

  return (
    <TableHead>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 whitespace-nowrap text-left font-medium transition-colors hover:text-foreground',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        {icon}
      </button>
    </TableHead>
  )
}

export function DatabaseInspectorGameTable({
  games
}: {
  games: OverviewGameStorageSummary[]
}): React.JSX.Element {
  const { t } = useTranslation('databaseInspector')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<OverviewSortKey>('total')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredGames = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase()

    return games
      .filter((game) => {
        if (!loweredQuery) return true
        return game.name.toLowerCase().includes(loweredQuery)
      })
      .sort((a, b) => {
        const result = compareGamesForTable(a, b, sortBy)
        return sortDirection === 'asc' ? -result : result
      })
  }, [games, query, sortBy, sortDirection])

  const handleSort = (nextSortKey: OverviewSortKey): void => {
    if (sortBy === nextSortKey) {
      setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
      return
    }

    setSortBy(nextSortKey)
    setSortDirection(getDefaultSortDirection(nextSortKey))
  }

  const openGameDetail = (gameId: string): void => {
    navigate({
      to: '/database-inspector/games/$gameId',
      params: { gameId }
    })
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t('table.title')}</CardTitle>
            <CardDescription>{t('table.description')}</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('table.searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                label={t('table.columns.name')}
                sortKey="name"
                currentSortKey={sortBy}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHead
                label={t('table.columns.total')}
                sortKey="total"
                currentSortKey={sortBy}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHead
                label={t('table.columns.attachments')}
                sortKey="attachments"
                currentSortKey={sortBy}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHead
                label={t('table.columns.attachmentCount')}
                sortKey="count"
                currentSortKey={sortBy}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHead
                label={t('table.columns.save')}
                sortKey="save"
                currentSortKey={sortBy}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <TableRow
                  key={game.gameId}
                  className="cursor-pointer"
                  onClick={() => openGameDetail(game.gameId)}
                >
                  <TableCell className="max-w-[18rem] truncate font-medium">{game.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatStorageSize(game.totalLogicalPayloadBytes)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatStorageSize(game.attachmentBytes)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {game.attachmentCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatStorageSize(game.attachmentCategoryBytes.save)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t('messages.noMatchingGames')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
