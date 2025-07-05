import { useEffect } from 'react'
import { ipcOnUnique, cn, HTMLParserOptions } from '~/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { Button } from '@ui/button'
import { Progress } from '@ui/progress'
import { useUpdaterStore, UpdateInfo, UpdateProgress } from './store'
import parse from 'html-react-parser'
import { useTranslation } from 'react-i18next'

export function UpdateDialog(): JSX.Element {
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
    await window.api.updater.startUpdate()
  }

  const handleInstall = async (): Promise<void> => {
    await window.api.updater.installUpdate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {updateInfo ? (
        <DialogContent className={cn('w-[600px] max-w-none')}>
          <DialogHeader>
            <DialogTitle>{t('dialog.title', { version: updateInfo?.version })}</DialogTitle>
          </DialogHeader>
          <div className={cn('')}>
            <div
              className={cn(
                'max-h-[300px] p-2 border-[1px] border-border pb-3 overflow-auto scrollbar-base text-sm bg-card text-card-foreground rounded-lg',
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
