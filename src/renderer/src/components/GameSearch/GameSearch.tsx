import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { cn } from '~/utils'
import { GameList } from '@appTypes/utils'

interface GameSearchProps {
  className?: string
  dataSource: string
  defaultName?: string
  onPick?: (gameId: string, game: GameList[number]) => void
}

export function GameSearch({ className, dataSource, defaultName, onPick }: GameSearchProps): React.JSX.Element {
  const { t } = useTranslation('adder')
  const [name, setName] = useState<string>(defaultName || '')
  const [results, setResults] = useState<GameList>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)

  async function handleSearch(): Promise<void> {
    if (!name) {
      toast.warning(t('gameAdder.search.notifications.enterName'))
      return
    }
    if (isSearching) return
    setIsSearching(true)
    try {
      await toast.promise(
        (async () => {
          const list = await ipcManager.invoke('scraper:search-games', dataSource, name)
          setResults(list)
          if (list.length === 0) {
            throw new Error(t('gameAdder.search.notifications.notFound'))
          }
          setSelectedId(list[0].id)
          onPick?.(list[0].id, list[0])
          return list
        })(),
        {
          loading: t('gameAdder.search.notifications.searching'),
          success: (data: GameList) => t('gameAdder.search.notifications.found', { count: data.length }),
          error: (err) => t('gameAdder.search.notifications.searchError', { message: err.message })
        }
      )
    } finally {
      setIsSearching(false)
    }
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
            if (e.key === 'Enter') void handleSearch()
          }}
        />
        <Button onClick={() => void handleSearch()} disabled={isSearching}>
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
