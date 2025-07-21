import { useEffect } from 'react'
import { cn, HTMLParserOptions } from '~/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Progress } from '@ui/progress'
import { useUpdaterStore, UpdateInfo, UpdateProgress } from './store'
import parse from 'html-react-parser'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

export function UpdateDialog(): React.JSX.Element {
  const { t } = useTranslation('updater')
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
    const removeUpdateAvailableListener = ipcManager.onUnique(
      'updater:update-available',
      (_event, updateInfo: UpdateInfo) => {
        setUpdateInfo(updateInfo)
        setIsOpen(true)
      }
    )

    const removeUpdateProgressListener = ipcManager.onUnique(
      'updater:download-progress',
      (_event, progress: UpdateProgress) => {
        setProgress(progress)
      }
    )

    const removeUpdateDownloadedListener = ipcManager.onUnique('updater:update-downloaded', () => {
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
    await ipcManager.invoke('updater:start-update')
  }

  const handleInstall = async (): Promise<void> => {
    await ipcManager.invoke('updater:install-update')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {updateInfo ? (
        <DialogContent className={cn('w-[650px]')}>
          <DialogHeader>
            <DialogTitle>{t('dialog.title', { version: updateInfo?.version })}</DialogTitle>
          </DialogHeader>
          <div
            className={cn(
              'h-[350px] p-2 pb-3 shadow-inner overflow-auto scrollbar-base-thin text-sm bg-accent/20 text-card-foreground rounded-xl',
              'prose max-w-none',
              'prose-headings:font-bold prose-headings:text-lg prose-headings:m-0 prose-headings:text-card-foreground',
              'prose-p:my-0',
              'prose-ul:list-disc prose-ul:ml-0',
              'prose-li:mb-0',
              'prose-a:text-primary', // Link Color
              'prose-a:no-underline hover:prose-a:underline' // underline effect
            )}
          >
            {parse(updateInfo?.releaseNotes, HTMLParserOptions) || t('dialog.noReleaseNotes')}
          </div>
          {downloading && progress && (
            <div>
              <Progress value={progress.percent} max={100} />
              <p>
                {t('dialog.downloadProgress', {
                  percent: Math.round(progress.percent),
                  speed: (progress.bytesPerSecond / 1024 / 1024).toFixed(2)
                })}
              </p>
            </div>
          )}
          <div className={cn('flex flex-row-reverse gap-3')}>
            {!downloading && (
              <Button variant={'outline'} onClick={() => setIsOpen(false)}>
                {t('actions.skipUpdate')}
              </Button>
            )}
            {!downloading && <Button onClick={handleUpdate}>{t('actions.update')}</Button>}
            {downloadComplete && <Button onClick={handleInstall}>{t('actions.install')}</Button>}
          </div>
        </DialogContent>
      ) : (
        <DialogContent>{t('dialog.latestVersion')}</DialogContent>
      )}
    </Dialog>
  )
}
