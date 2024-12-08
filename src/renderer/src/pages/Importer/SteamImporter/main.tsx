import { useEffect } from 'react'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import { Progress } from '@ui/progress'
import { ScrollArea } from '@ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useSteamImporterStore } from './store'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { cn } from '~/utils'
import { useState } from 'react'
import { toast } from 'sonner'

export function SteamImporter(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false)
  const {
    isOpen,
    setIsOpen,
    steamId,
    setSteamId,
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

  const startImport = async (): Promise<void> => {
    if (!steamId) return

    try {
      setIsLoading(true)
      reset()
      await ipcInvoke('import-user-steam-games', steamId)
    } catch (error) {
      console.error('导入失败:', error)
      updateProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: '导入失败，请重试'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate the number of successes and failures
  const successCount = gameLogs.filter((g) => g.status === 'success').length
  const errorCount = gameLogs.filter((g) => g.status === 'error').length

  // Processing dialog box closes
  const handleClose = (): void => {
    if (status !== 'processing') {
      setIsOpen(false)
      reset()
    } else {
      toast.warning('请等待导入完成')
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
        className={cn('transition-all duration-300')}
        onClose={handleClose}
      >
        <DialogHeader>
          <DialogTitle>导入 Steam 游戏</DialogTitle>
          <DialogDescription>
            请输入你的 Steam ID 来导入游戏库，ID 可在个人资料的 URL 中获取。
          </DialogDescription>
        </DialogHeader>

        {/* Steam ID input */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="steamId"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="输入 Steam ID"
              className={cn('col-span-3')}
              disabled={status === 'processing' || isLoading}
            />
            <Button
              onClick={startImport}
              disabled={!steamId || status === 'processing' || isLoading}
              className={cn('relative', 'transition-all duration-200', isLoading && 'opacity-80')}
            >
              {isLoading ? (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center',
                    'bg-primary/10 rounded-md'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 border-2 border-accent border-t-accent-foreground',
                      'rounded-full animate-spin'
                    )}
                  />
                </div>
              ) : (
                '导入'
              )}
            </Button>
          </div>
        </div>

        {/* progress indicator */}
        <div
          className={cn(
            'space-y-4 overflow-hidden transition-all duration-300',
            status === 'started' ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'
          )}
        >
          {/* progress bar */}
          <div className={cn('space-y-2')}>
            <Progress
              value={progress}
              className={cn('w-full transition-all duration-300', 'overflow-hidden')}
            />
            <p
              className={cn(
                'text-sm text-muted-foreground text-center',
                'transition-opacity duration-200'
              )}
            >
              {progress}%
            </p>
          </div>

          {/* status message */}
          <Alert
            variant={status === 'error' ? 'destructive' : 'default'}
            className={cn('transition-all duration-300')}
          >
            <AlertCircle className={cn('h-4 w-4')} />
            <AlertTitle>
              {status === 'processing' && '正在导入'}
              {status === 'completed' && '导入完成'}
              {status === 'error' && '导入错误'}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {/* Game Import Log */}
          <div className={cn('border rounded-lg', 'transition-all duration-300')}>
            <ScrollArea className={cn('h-[200px] p-4')}>
              <div className={cn('space-y-2')}>
                {gameLogs.map((game, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between',
                      'p-2 border rounded',
                      'animate-fadeIn',
                      'transition-all duration-200'
                    )}
                  >
                    <div className={cn('flex items-center gap-2')}>
                      {game.status === 'success' ? (
                        <CheckCircle2 className={cn('h-4 w-4 text-primary', 'animate-scaleIn')} />
                      ) : (
                        <XCircle className={cn('h-4 w-4 text-destructive', 'animate-scaleIn')} />
                      )}
                      <span className={cn('')}>{game.name}</span>
                    </div>
                    {game.error && (
                      <span className={cn('text-sm text-destructive', 'animate-fadeIn')}>
                        {game.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Completion statistics */}
          {status === 'completed' && (
            <Alert className={cn('animate-fadeIn')}>
              <CheckCircle2 className={cn('h-4 w-4')} />
              <AlertTitle>导入完成</AlertTitle>
              <AlertDescription>
                成功: {successCount} 个 失败: {errorCount} 个
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
