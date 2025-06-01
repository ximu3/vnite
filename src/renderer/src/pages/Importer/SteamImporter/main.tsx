import { useEffect, useMemo } from 'react'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import { Progress } from '@ui/progress'
import { ScrollArea } from '@ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Search } from 'lucide-react'
import { useSteamImporterStore } from './store'
import { ipcOnUnique } from '~/utils'
import { cn } from '~/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@ui/checkbox'
import { useTranslation } from 'react-i18next'

export function SteamImporter(): JSX.Element {
  const { t } = useTranslation('importer')
  const [searchQuery, setSearchQuery] = useState('')
  const [isImportLoading, setIsImportLoading] = useState(false)
  const [hasEverFetched, setHasEverFetched] = useState(false)

  const {
    isOpen,
    setIsOpen,
    steamId,
    setSteamId,
    games,
    setGames,
    isLoadingGames,
    setIsLoadingGames,
    toggleGameSelection,
    toggleAllGames,
    progress,
    status,
    message,
    gameLogs,
    updateProgress,
    reset
  } = useSteamImporterStore()

  // Setting the IPC Listener
  useEffect(() => {
    const handleProgress = (_event: any, data: any): void => {
      updateProgress(data)
    }

    const removeProgressListener = ipcOnUnique('import-steam-games-progress', handleProgress)

    return (): void => {
      removeProgressListener()
    }
  }, [updateProgress])

  // Get Game List
  const fetchGames = async (): Promise<void> => {
    if (!steamId) return

    try {
      setIsLoadingGames(true)
      const gamesData = await window.api.importer.getSteamGames(steamId)
      setGames(
        gamesData.map((game) => ({
          ...game,
          selected: false
        }))
      )
      setHasEverFetched(true) // Mark the list of games that have been fetched
    } catch (error) {
      console.error('Failed to get game list:', error)
      toast.error(t('steamImporter.notifications.fetchFailed'))
    } finally {
      setIsLoadingGames(false)
    }
  }

  // Start importing the selected game
  const startImport = async (): Promise<void> => {
    const selectedGames = games.filter((game) => game.selected)
    if (selectedGames.length === 0) {
      toast.error(t('steamImporter.notifications.selectAtLeastOne'))
      return
    }

    try {
      setIsImportLoading(true)
      reset()
      await window.api.importer.importSelectedSteamGames(
        selectedGames.map((game) => ({
          appId: game.appId,
          name: game.name,
          totalPlayingTime: game.totalPlayingTime
        }))
      )
      setIsImportLoading(false)

      // Remove the selected game from the game list after the import is complete
      const remainingGames = games.filter((game) => !game.selected)
      setGames(remainingGames)

      // If there are no games left, it shows that all imports are complete
      if (remainingGames.length === 0) {
        toast.success(t('steamImporter.notifications.allImported'))
      }
    } catch (error) {
      console.error('import failure:', error)
      updateProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: t('steamImporter.notifications.importFailed')
      })
    }
  }

  // Filter games
  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate the number of successes and failures
  const successCount = gameLogs.filter((g) => g.status === 'success').length
  const errorCount = gameLogs.filter((g) => g.status === 'error').length

  // Processing dialog box closes
  const handleClose = (): void => {
    if (status !== 'processing') {
      setIsOpen(false)
      reset()
      setGames([])
      setSteamId('')
      setSearchQuery('')
      setHasEverFetched(false) // Reset acquisition state
    } else {
      toast.warning(t('steamImporter.notifications.waitForCompletion'))
    }
  }

  const isImporting = status === 'processing'
  const selectedCount = games.filter((game) => game.selected).length

  // Defining state types
  type ImportStatus = 'initial' | 'ready' | 'loading' | 'empty' | 'hasGames'

  const currentStatus = useMemo((): ImportStatus => {
    if (!steamId) return 'initial'
    if (steamId && !isLoadingGames && games.length === 0 && !hasEverFetched) return 'ready'
    if (isLoadingGames) return 'loading'
    if (games.length === 0 && hasEverFetched) return 'empty'
    return 'hasGames'
  }, [steamId, isLoadingGames, games.length, hasEverFetched])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
        className={cn('transition-all duration-300 max-w-xl')}
      >
        <DialogHeader>
          <DialogTitle>{t('steamImporter.dialog.title')}</DialogTitle>
          <DialogDescription>{t('steamImporter.dialog.description')}</DialogDescription>
        </DialogHeader>

        {/* Steam ID Input */}
        <div className="grid gap-4 py-4">
          <div className="grid items-center grid-cols-4 gap-4">
            <Input
              id="steamId"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder={t('steamImporter.input.steamId')}
              className="col-span-3"
              disabled={isLoadingGames || isImporting}
            />
            <Button
              onClick={fetchGames}
              disabled={!steamId || isLoadingGames || isImporting}
              className="relative"
            >
              {isLoadingGames ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2">{t('steamImporter.input.fetch')}</span>
            </Button>
          </div>
        </div>

        {/* Game List */}
        {!isImporting && (
          <div className="space-y-4">
            {((): JSX.Element => {
              switch (currentStatus) {
                case 'initial':
                  return (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertTitle>{t('steamImporter.status.initial.title')}</AlertTitle>
                      <AlertDescription>
                        {t('steamImporter.status.initial.description')}
                      </AlertDescription>
                    </Alert>
                  )
                case 'ready':
                  return (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertTitle>{t('steamImporter.status.ready.title')}</AlertTitle>
                      <AlertDescription>
                        {t('steamImporter.status.ready.description')}
                      </AlertDescription>
                    </Alert>
                  )
                case 'loading':
                  return (
                    <Alert>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <AlertTitle>{t('steamImporter.status.loading.title')}</AlertTitle>
                      <AlertDescription>
                        {t('steamImporter.status.loading.description')}
                      </AlertDescription>
                    </Alert>
                  )
                case 'empty':
                  return (
                    <Alert>
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertTitle>{t('steamImporter.status.empty.title')}</AlertTitle>
                      <AlertDescription>
                        {t('steamImporter.status.empty.description')}
                      </AlertDescription>
                    </Alert>
                  )
                case 'hasGames':
                  return (
                    // Game List Contents
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="selectAll"
                            className={cn('rounded-lg')}
                            checked={selectedCount === games.length}
                            onCheckedChange={(checked) => toggleAllGames(!!checked)}
                          />
                          <label htmlFor="selectAll" className="text-sm">
                            {t('steamImporter.gameList.selectAll', {
                              selected: selectedCount,
                              total: games.length
                            })}
                          </label>
                        </div>
                        <Input
                          placeholder={t('steamImporter.gameList.search')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>

                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <div className="space-y-2">
                          {filteredGames.map((game) => (
                            <div
                              key={game.appId}
                              className="flex items-center p-2 space-x-2 rounded-lg hover:bg-accent"
                            >
                              <Checkbox
                                id={`game-${game.appId}`}
                                checked={game.selected}
                                className={cn('rounded-lg')}
                                onCheckedChange={() => toggleGameSelection(game.appId)}
                              />
                              <label htmlFor={`game-${game.appId}`} className="flex-1 text-sm">
                                {game.name}
                              </label>
                              <span className="text-sm text-muted-foreground">
                                {t('steamImporter.gameList.hours', {
                                  hours: Math.round(game.totalPlayingTime / (1000 * 60 * 60))
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <Button
                        onClick={startImport}
                        disabled={selectedCount === 0 || isImportLoading}
                        className="relative w-full"
                      >
                        {isImportLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>{t('steamImporter.import.preparing')}</span>
                          </>
                        ) : (
                          t('steamImporter.import.button', { count: selectedCount })
                        )}
                      </Button>
                    </>
                  )
              }
            })()}
          </div>
        )}

        {/* Import progress */}
        {isImporting && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">{progress}%</p>
            </div>

            <Alert variant="default">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>{t('steamImporter.import.progress.title')}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-2">
                {gameLogs.map((game, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 justify-between max-w-[500px] p-2 truncate border rounded animate-fadeIn"
                  >
                    <div className="flex items-center gap-2">
                      {game.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-primary animate-scaleIn" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive animate-scaleIn" />
                      )}
                      <span className="truncate">{game.name}</span>
                    </div>
                    {game.error && (
                      <span className="text-sm truncate text-destructive animate-fadeIn">
                        {game.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Import completed or error status display, only displays when the status is completed or error */}
        {(status === 'completed' || status === 'error') && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>
              {status === 'completed'
                ? t('steamImporter.import.progress.completed')
                : t('steamImporter.import.progress.error')}
            </AlertTitle>
            <AlertDescription>
              {status === 'completed'
                ? t('steamImporter.import.progress.summary', {
                    success: successCount,
                    error: errorCount
                  })
                : message}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
