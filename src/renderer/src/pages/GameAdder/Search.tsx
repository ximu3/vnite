import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
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
import { useGameLocalState } from '~/hooks'
import { cn } from '~/utils'
import type { DuplicateCheckInput } from '~/utils/gameDuplicates'
import { gameAdderFlow } from './flow'
import { GameList } from './GameList'
import { useGameAdderStore } from './store'

function PathRowWithDb({ gameId }: { gameId: string }): React.JSX.Element | null {
  const { t } = useTranslation('adder')
  const [dbGamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [rootPath] = useGameLocalState(gameId, 'utils.rootPath')
  if (!gameId || (!dbGamePath && !rootPath)) return null
  const displayPath = dbGamePath || rootPath || ''
  return (
    <>
      <div className={cn('whitespace-nowrap select-none pb-1.5')}>
        {t('gameAdder.search.gamePath')}
      </div>
      <div className={cn('text-xs text-muted-foreground break-all select-text pb-1.5')}>
        {displayPath || '-'}
      </div>
    </>
  )
}

export function Search(): React.JSX.Element {
  const { t } = useTranslation('adder')
  const { draft, updateDraft, providers, gameList } = useGameAdderStore()
  const hasResults = gameList.length > 0
  const { dbId, dataSource, name, gamePath, dirPath, dataSourceId } = draft
  const [inputName, setInputName] = React.useState(name)
  const [inputId, setInputId] = React.useState(dataSourceId)

  useEffect(() => {
    if (inputName !== name) {
      setInputName(name)
    }
  }, [name])

  useEffect(() => {
    if (inputId !== dataSourceId) {
      setInputId(dataSourceId)
    }
  }, [dataSourceId, dataSource])

  const searchGames = (): void => {
    const state = useGameAdderStore.getState()
    if (state.pending) return
    if (!inputName) {
      toast.warning(t('gameAdder.search.notifications.enterName'))
      return
    }
    // Lock synchronously before the first asynchronous request.
    useGameAdderStore.setState({ pending: true })
    toast.promise(
      async (): Promise<number> => {
        const result = await ipcManager.invoke(
          'scraper:search-games',
          state.draft.dataSource,
          inputName
        )
        if (!result.length) throw new Error(t('gameAdder.search.notifications.notFound'))
        updateDraft({ name: inputName, dataSource: state.draft.dataSource })
        useGameAdderStore.setState({ gameList: result })
        return result.length
      },
      {
        loading: t('gameAdder.search.notifications.searching'),
        success: (count) => t('gameAdder.search.notifications.found', { count }),
        error: (error) =>
          t('gameAdder.search.notifications.searchError', {
            message: error instanceof Error ? error.message : String(error)
          }),
        finally: () => useGameAdderStore.setState({ pending: false })
      }
    )
  }

  const confirmCandidate = (): void => {
    const state = useGameAdderStore.getState()
    if (state.pending) return
    const draft = { ...state.draft, dataSourceId: inputId }
    if (draft.dataSource === 'none' ? !draft.dirPath : !draft.dataSourceId) {
      toast.warning(
        t(
          draft.dataSource === 'none'
            ? 'gameAdder.search.notifications.selectGamePath'
            : 'gameAdder.search.notifications.enterId'
        )
      )
      return
    }
    useGameAdderStore.setState({ pending: true })
    toast.promise(
      async (): Promise<void> => {
        let candidate: DuplicateCheckInput | null = null
        if (draft.dbId) {
          const exists = await ipcManager.invoke('scraper:check-game-exists', draft.dataSource, {
            type: 'id',
            value: draft.dataSourceId
          })
          if (!exists) throw new Error(t('gameAdder.search.notifications.invalidId'))
        } else if (draft.dataSource === 'none') {
          const name = window.api.path.basename(draft.dirPath || draft.gamePath)
          candidate = { name, originalName: name }
        } else {
          const metadata = await ipcManager.invoke('scraper:get-game-metadata', draft.dataSource, {
            type: 'id',
            value: draft.dataSourceId
          })
          if (!metadata) throw new Error()
          candidate = {
            name: metadata.name,
            originalName: metadata.originalName,
            dataSource: draft.dataSource,
            dataSourceId: draft.dataSourceId
          }
        }
        // Commit the selection used by this request before advancing the flow.
        updateDraft({
          dataSource: draft.dataSource,
          dataSourceId: draft.dataSourceId,
          dirPath: draft.dirPath,
          gamePath: draft.gamePath
        })
        gameAdderFlow.confirmCandidate(candidate)
      },
      {
        loading:
          draft.dataSource !== 'none' ? t('gameAdder.search.notifications.recognizing') : undefined,
        error: (error) => {
          const message = error instanceof Error ? error.message : String(error)
          return draft.dataSource === 'none'
            ? t('gameAdder.search.notifications.addError')
            : t('gameAdder.search.notifications.recognizeError', { message })
        },
        finally: () => useGameAdderStore.setState({ pending: false })
      }
    )
  }

  const selectPath = async (): Promise<void> => {
    try {
      const path = await ipcManager.invoke(
        'system:select-path-dialog',
        ['openFile'],
        undefined,
        gamePath || dirPath
      )
      if (path) updateDraft({ dirPath: window.api.path.dirname(path), gamePath: path })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
  }

  const gameNameInput = React.useRef<HTMLInputElement>(null)
  const gameIdInput = React.useRef<HTMLInputElement>(null)
  const gamePathInput = React.useRef<HTMLInputElement>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      (gameNameInput.current ?? gamePathInput.current)?.focus()
    )
    return (): void => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={cn(hasResults ? 'flex h-[80vh] w-[60vw] flex-col gap-3 p-3' : 'w-[500px]')}>
      {hasResults && <GameList />}
      <Card
        className={cn(
          'grid shrink-0 grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm items-center',
          hasResults ? 'p-6 py-5' : 'bg-transparent py-0 shadow-none dark:shadow-none'
        )}
      >
        {dbId ? (
          <PathRowWithDb gameId={dbId} />
        ) : (
          (gamePath || dirPath) && (
            <>
              <div className={cn('whitespace-nowrap select-none pb-1.5')}>
                {t('gameAdder.search.gamePath')}
              </div>
              <div className={cn('text-xs text-muted-foreground break-all select-text pb-1.5')}>
                {gamePath || dirPath || '-'}
              </div>
            </>
          )
        )}

        {/* Data source selection */}
        <div className={cn('whitespace-nowrap select-none')}>
          {t('gameAdder.search.dataSource')}
        </div>
        <div>
          <Select
            onValueChange={(value) => {
              updateDraft({ dataSource: value })
            }}
            value={dataSource}
          >
            <SelectTrigger className={cn('min-w-[130px]')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('gameAdder.search.dataSources.label')}</SelectLabel>
                {!dbId && (
                  <SelectItem value="none">{t('gameAdder.search.dataSources.none')}</SelectItem>
                )}
                {(providers ?? []).map((provider) => (
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
                  if (e.key === 'Enter') confirmCandidate()
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gameNameInput.current?.focus()
                }}
              />
              <Button onClick={confirmCandidate}>{t('gameAdder.search.recognizeButton')}</Button>
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
                ref={gamePathInput}
                placeholder={t('gameAdder.search.gamePathPlaceholder')}
                value={gamePath || dirPath}
                readOnly
              />
              <Button variant={'outline'} size={'icon'} onClick={selectPath}>
                <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
              </Button>
              <Button onClick={confirmCandidate}>{t('gameAdder.search.addButton')}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
