import { useEffect } from 'react'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@ui/dialog'
import { Button } from '@ui/button'
import { Progress } from '@ui/progress'
import { useUpdaterStore, UpdateInfo, UpdateProgress } from './store'

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发现新版本 {updateInfo?.version}</DialogTitle>
            <DialogDescription>
              更新说明：
              <pre style={{ whiteSpace: 'pre-wrap' }}>{updateInfo?.releaseNotes}</pre>
            </DialogDescription>
          </DialogHeader>
          {downloading && progress && (
            <div>
              <Progress value={progress.percent} max={100} />
              <p>{`${Math.round(progress.percent)}% - ${(progress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`}</p>
            </div>
          )}
          <div>
            {!downloading && <Button onClick={() => setIsOpen(false)}>暂不更新</Button>}
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
