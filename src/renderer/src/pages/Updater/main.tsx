import { useEffect } from 'react'
import { ipcInvoke, ipcOnUnique, cn, HTMLParserOptions } from '~/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { Button } from '@ui/button'
import { Progress } from '@ui/progress'
import { useUpdaterStore, UpdateInfo, UpdateProgress } from './store'
import parse from 'html-react-parser'

export function UpdateDialog(): JSX.Element {
  const {
    isOpen,
    setIsOpen,
    updateInfo,
    setUpdateInfo,
    downloading,
    setDownloading,
    progress,
    setProgress,
    downloadComplete,
    setDownloadComplete
  } = useUpdaterStore()

  useEffect(() => {
    const removeUpdateAvailableListener = ipcOnUnique(
      'update-available',
      (_event, updateInfo: UpdateInfo) => {
        setUpdateInfo(updateInfo)
        setIsOpen(true)
      }
    )

    const removeUpdateProgressListener = ipcOnUnique(
      'update-progress',
      (_event, progress: UpdateProgress) => {
        setProgress(progress)
      }
    )

    const removeUpdateDownloadedListener = ipcOnUnique('update-downloaded', () => {
      setDownloadComplete(true)
    })

    return (): void => {
      removeUpdateAvailableListener()
      removeUpdateProgressListener()
      removeUpdateDownloadedListener()
    }
  }, [])

  const handleUpdate = async (): Promise<void> => {
    setDownloading(true)
    await ipcInvoke('start-update')
  }

  const handleInstall = async (): Promise<void> => {
    await ipcInvoke('install-update')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {updateInfo ? (
        <DialogContent className={cn('w-[600px] max-w-none')}>
          <DialogHeader>
            <DialogTitle>发现新版本 {updateInfo?.version}</DialogTitle>
          </DialogHeader>
          <div className={cn('')}>
            <div
              className={cn(
                'max-h-[300px] p-2 border-[1px] border-border pb-3 overflow-auto scrollbar-base text-sm bg-card text-card-foreground rounded-[0.3rem]',
                'prose max-w-none',
                'prose-headings:font-bold prose-headings:text-lg prose-headings:m-0 prose-headings:text-card-foreground',
                'prose-p:my-0',
                'prose-ul:list-disc prose-ul:ml-0',
                'prose-li:mb-0',
                'prose-a:text-primary', // 链接颜色
                'prose-a:no-underline hover:prose-a:underline' // 下划线效果
              )}
            >
              {parse(updateInfo?.releaseNotes, HTMLParserOptions) || '无更新说明'}
            </div>
          </div>
          {downloading && progress && (
            <div>
              <Progress value={progress.percent} max={100} />
              <p>{`${Math.round(progress.percent)}% - ${(progress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`}</p>
            </div>
          )}
          <div className={cn('flex flex-row-reverse gap-3')}>
            {!downloading && (
              <Button variant={'outline'} onClick={() => setIsOpen(false)}>
                暂不更新
              </Button>
            )}
            {!downloading && <Button onClick={handleUpdate}>立即更新</Button>}
            {downloadComplete && <Button onClick={handleInstall}>立即安装</Button>}
          </div>
        </DialogContent>
      ) : (
        <DialogContent>已是最新版本</DialogContent>
      )}
    </Dialog>
  )
}
