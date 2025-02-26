import { useEffect, useMemo } from 'react'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import { Progress } from '@ui/progress'
import { ScrollArea } from '@ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Search } from 'lucide-react'
import { useSteamImporterStore, GameInfo } from './store'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { cn } from '~/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@ui/checkbox'

export function SteamImporter(): JSX.Element {
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
      const gamesData = (await ipcInvoke('get-steam-games', steamId)) as GameInfo[]
      setGames(
        gamesData.map((game) => ({
          ...game,
          selected: false
        }))
      )
      setHasEverFetched(true) // Mark the list of games that have been fetched
    } catch (error) {
      console.error('获取游戏列表失败:', error)
      toast.error('获取游戏列表失败，请重试')
    } finally {
      setIsLoadingGames(false)
    }
  }

  // Start importing the selected game
  const startImport = async (): Promise<void> => {
    const selectedGames = games.filter((game) => game.selected)
    if (selectedGames.length === 0) {
      toast.error('请至少选择一个游戏')
      return
    }

    try {
      setIsImportLoading(true)
      reset()
      await ipcInvoke(
        'import-selected-steam-games',
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
        toast.success('所有游戏已导入完成')
      }
    } catch (error) {
      console.error('导入失败:', error)
      updateProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: '导入失败，请重试'
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
      toast.warning('请等待导入完成')
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
          <DialogTitle>导入 Steam 游戏</DialogTitle>
          <DialogDescription>
            请输入你的 Steam ID 来导入游戏库，ID 可在个人资料的 URL 中获取。
          </DialogDescription>
        </DialogHeader>

        {/* Steam ID Input */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="steamId"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="输入 Steam ID"
              className="col-span-3"
              disabled={isLoadingGames || isImporting}
            />
            <Button
              onClick={fetchGames}
              disabled={!steamId || isLoadingGames || isImporting}
              className="relative"
            >
              {isLoadingGames ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">获取</span>
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
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>开始导入</AlertTitle>
                      <AlertDescription>请输入你的 Steam ID 获取游戏列表</AlertDescription>
                    </Alert>
                  )
                case 'ready':
                  return (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>准备获取</AlertTitle>
                      <AlertDescription>{'请点击"获取"按钮来获取游戏列表'}</AlertDescription>
                    </Alert>
                  )
                case 'loading':
                  return (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>加载中</AlertTitle>
                      <AlertDescription>正在获取游戏列表...</AlertDescription>
                    </Alert>
                  )
                case 'empty':
                  return (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>已全部导入</AlertTitle>
                      <AlertDescription>所有游戏都已成功导入</AlertDescription>
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
                            全选 ({selectedCount}/{games.length})
                          </label>
                        </div>
                        <Input
                          placeholder="搜索游戏..."
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
                              className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg"
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
                                {Math.round(game.totalPlayingTime / (1000 * 60 * 60))}小时
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <Button
                        onClick={startImport}
                        disabled={selectedCount === 0 || isImportLoading}
                        className="w-full relative"
                      >
                        {isImportLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>正在准备导入...</span>
                          </>
                        ) : (
                          `导入选中的游戏 (${selectedCount})`
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
              <p className="text-sm text-muted-foreground text-center">{progress}%</p>
            </div>

            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>正在导入</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-2">
                {gameLogs.map((game, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded animate-fadeIn"
                  >
                    <div className="flex items-center gap-2">
                      {game.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-primary animate-scaleIn" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive animate-scaleIn" />
                      )}
                      <span>{game.name}</span>
                    </div>
                    {game.error && (
                      <span className="text-sm text-destructive animate-fadeIn">{game.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 导入完成或错误状态显示，只在状态为 completed 或 error 时显示 */}
        {(status === 'completed' || status === 'error') && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{status === 'completed' ? '导入完成' : '导入错误'}</AlertTitle>
            <AlertDescription>
              {status === 'completed' ? `成功: ${successCount} 个 失败: ${errorCount} 个` : message}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
