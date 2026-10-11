import { Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { GameList } from '@appTypes/utils'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { ipcManager } from '~/app/ipc'
import { cn } from '~/utils'

interface GameSearchProps {
  className?: string
  dataSource: string
  defaultName?: string
  onPick?: (gameId: string, game: GameList[number]) => void
}

export function GameSearch({
  className,
  dataSource,
  defaultName,
  onPick
}: GameSearchProps): React.JSX.Element {
  const { t } = useTranslation('adder')
  const [name, setName] = useState<string>(defaultName || '')
  const [results, setResults] = useState<GameList>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)

  function handleSearch(): void {
    if (!name) {
      toast.warning(t('gameAdder.search.notifications.enterName'))
      return
    }
    if (isSearching) return
    setIsSearching(true)
    setResults([])
    setSelectedId('')

    toast.promise(
      async () => {
        const list = await ipcManager.invoke('scraper:search-games', dataSource, name)
        if (!list.length) throw new Error(t('gameAdder.search.notifications.notFound'))

        setResults(list)
        setSelectedId(list[0].id)
        onPick?.(list[0].id, list[0])
        return list
      },
      {
        loading: t('gameAdder.search.notifications.searching'),
        success: (list) => t('gameAdder.search.notifications.found', { count: list.length }),
        error: (error) =>
          t('gameAdder.search.notifications.searchError', {
            message: error instanceof Error ? error.message : ''
          }),
        finally: () => setIsSearching(false)
      }
    )
  }

  return (
    <>
      <div className={cn('select-none whitespace-nowrap')}>{t('gameAdder.search.gameName')}</div>
      <div className={cn('flex gap-2', className)}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('gameAdder.search.gameNamePlaceholder')}
          className="flex-grow"
          disabled={isSearching}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('gameAdder.search.notifications.searching')}
            </>
          ) : (
            t('gameAdder.search.searchButton')
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <>
          <div />
          <Select
            value={selectedId}
            onValueChange={(val) => {
              setSelectedId(val)
              const g = results.find((x) => x.id === val)
              if (g) onPick?.(val, g)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {results.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </>
  )
}
