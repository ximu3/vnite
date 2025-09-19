import { ScraperCapabilities } from '@appTypes/utils'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { cn } from '~/utils'
import { GameList, useGameAdderStore } from './store'
import { useGameLocalState } from '~/hooks'

export function Search({ className }: { className?: string }): React.JSX.Element {
  const { t } = useTranslation('adder')
  const {
    dbId,
    dataSource,
    setDataSource,
    name,
    setName,
    gamePath,
    setGamePath,
    dirPath,
    setDirPath,
    dataSourceId,
    setDataSourceId,
    setGameList,
    setCurrentPage,
    handleClose
  } = useGameAdderStore()

  const PathRowWithDb = ({ gameId }: { gameId: string }): React.JSX.Element | null => {
    const [dbGamePath] = useGameLocalState(gameId, 'path.gamePath')
    const [markPath] = useGameLocalState(gameId, 'utils.markPath')
    if (!gameId) return null
    const displayPath = dbGamePath || markPath || ''
    return (
      <>
        <div className={cn('whitespace-nowrap select-none')}>{t('gameAdder.search.gamePath')}</div>
        <div className={cn('text-xs text-muted-foreground break-all select-text')}>
          {displayPath || '-'}
        </div>
      </>
    )
  }

  const [availableDataSources, setAvailableDataSources] = React.useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const availableDataSources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['searchGames', 'checkGameExists', 'getGameMetadata', 'getGameBackgrounds', 'getGameCovers']
      )
      setAvailableDataSources(availableDataSources)
      if (availableDataSources.length > 0) {
        if (!availableDataSources.some((ds) => ds.id === dataSource)) {
          setDataSource(availableDataSources[0].id)
        }
      } else {
        toast.error(t('gameAdder.search.notifications.noDataSources'))
      }
    }
    fetchAvailableDataSources()
  }, [])

  const [inputName, setInputName] = React.useState(name)
  React.useEffect(() => {
    if (inputName !== name) {
      setInputName(name)
    }
  }, [name])
  const [inputId, setInputId] = React.useState(dataSourceId)
  React.useEffect(() => {
    if (inputId !== dataSourceId) {
      setInputId(dataSourceId)
    }
  }, [dataSourceId])

  const gameNameInput = React.useRef<HTMLInputElement>(null)
  const gameIdInput = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    setTimeout(() => gameNameInput.current?.focus())
  }, [])

  async function searchGames(): Promise<void> {
    if (!inputName) {
      toast.warning(t('gameAdder.search.notifications.enterName'))
      return
    }
    toast.promise(
      (async (): Promise<GameList> => {
        const result = await ipcManager.invoke('scraper:search-games', dataSource, inputName)
        if (result.length === 0) {
          throw new Error(t('gameAdder.search.notifications.notFound'))
        }
        setGameList(result)
        setName(inputName)
        setCurrentPage('games')
        return result
      })(),
      {
        loading: t('gameAdder.search.notifications.searching'),
        success: (data) => t('gameAdder.search.notifications.found', { count: data.length }),
        error: (err) => t('gameAdder.search.notifications.searchError', { message: err.message })
      }
    )
  }

  async function recognizeGame(): Promise<void> {
    if (!inputId) {
      toast.warning(t('gameAdder.search.notifications.enterId'))
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        const result = await ipcManager.invoke('scraper:check-game-exists', dataSource, {
          type: 'id',
          value: inputId
        })
        if (!result) {
          throw new Error(t('gameAdder.search.notifications.invalidId'))
        }
        setDataSourceId(inputId)
        setCurrentPage('backgrounds')
      })(),
      {
        loading: t('gameAdder.search.notifications.recognizing'),
        success: t('gameAdder.search.notifications.recognized'),
        error: (err) => t('gameAdder.search.notifications.recognizeError', { message: err.message })
      }
    )
  }

  async function addGameDirectly(): Promise<void> {
    if (!dirPath) {
      toast.warning(t('gameAdder.search.notifications.selectGamePath'))
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        await ipcManager.invoke('adder:add-game-to-db-without-metadata', dirPath, gamePath)
        handleClose()
      })(),
      {
        loading: t('gameAdder.search.notifications.adding'),
        success: t('gameAdder.search.notifications.addSuccess'),
        error: t('gameAdder.search.notifications.addError')
      }
    )
  }

  async function selectGamePath(): Promise<void> {
    const selectedPath = await ipcManager.invoke(
      'system:select-path-dialog',
      ['openFile'],
      undefined,
      gamePath || dirPath
    )
    if (!selectedPath) {
      return
    }
    const newdirPath = window.api.path.dirname(selectedPath)
    setDirPath(newdirPath)
    setGamePath(selectedPath)
  }

  return (
    <div className={cn('w-[500px] h-auto', className)}>
      <div className={cn('grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm items-center')}>
        {dbId ? (
          <PathRowWithDb gameId={dbId} />
        ) : (
          <>
            <div className={cn('whitespace-nowrap select-none')}>{t('gameAdder.search.gamePath')}</div>
            <div className={cn('text-xs text-muted-foreground break-all select-text')}>
              {gamePath || dirPath || '-'}
            </div>
          </>
        )}

        {/* Data source selection */}
        <div className={cn('whitespace-nowrap select-none')}>
          {t('gameAdder.search.dataSource')}
        </div>
        <div>
          <Select onValueChange={setDataSource} value={dataSource}>
            <SelectTrigger className={cn('min-w-[130px]')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('gameAdder.search.dataSources.label')}</SelectLabel>
                <SelectItem value="none">{t('gameAdder.search.dataSources.none')}</SelectItem>
                {availableDataSources.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {dataSource !== 'none' ? (
          <>
            {/* Game Name Input */}
            <div className={cn('whitespace-nowrap select-none')}>
              {t('gameAdder.search.gameName')}
            </div>
            <div className={cn('flex flex-row gap-3')}>
              <Input
                className={cn('flex-1')}
                ref={gameNameInput}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder={t('gameAdder.search.gameNamePlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchGames()
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameIdInput.current?.focus()
                }}
              />
              <Button onClick={searchGames}>{t('gameAdder.search.searchButton')}</Button>
            </div>

            {/* Game ID Input */}
            <div className={cn('whitespace-nowrap select-none')}>
              {t('gameAdder.search.gameId')}
            </div>
            <div className={cn('flex flex-row gap-3')}>
              <Input
                className={cn('flex-1')}
                ref={gameIdInput}
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder={t('gameAdder.search.gameIdPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') recognizeGame()
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameNameInput.current?.focus()
                }}
              />
              <Button onClick={recognizeGame}>{t('gameAdder.search.recognizeButton')}</Button>
            </div>
          </>
        ) : (
          <>
            <div className={cn('whitespace-nowrap select-none')}>
              {t('gameAdder.search.gamePath')}
            </div>
            <div className={cn('flex flex-row gap-3')}>
              <Input
                className={cn('flex-1')}
                placeholder={t('gameAdder.search.gamePathPlaceholder')}
                value={gamePath || dirPath}
                readOnly
              />
              <Button variant={'outline'} size={'icon'} onClick={selectGamePath}>
                <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
              </Button>
              <Button onClick={addGameDirectly}>{t('gameAdder.search.addButton')}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
