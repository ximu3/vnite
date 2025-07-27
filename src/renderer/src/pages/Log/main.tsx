import { useState, useEffect, useRef } from 'react'
import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@ui/dialog'
import { RefreshCcw, Copy, Check } from 'lucide-react'
import { ipcManager } from '~/app/ipc'
import { useLogStore } from './store'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function LogDialog(): React.JSX.Element {
  const { t } = useTranslation('log')
  const { isOpen, setIsOpen } = useLogStore()
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async (): Promise<void> => {
    try {
      setLoading(true)
      const logContent = await ipcManager.invoke('utils:get-app-log-contents-in-current-lifetime')
      setLogs(logContent)
    } catch (error) {
      toast.error(t('notifications.fetchError', { error: String(error) }))
      setLogs(t('fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = (): void => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }

  // Fetch logs when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen])

  const handleCopyToClipboard = async (): Promise<void> => {
    try {
      await ipcManager.invoke('utils:copy-app-log-in-current-lifetime-to-clipboard-as-file')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error(t('notifications.copyError', { error: String(error) }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[60vw] h-[70vh]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {/* Log content */}
        <div
          ref={logContainerRef}
          className="h-full overflow-auto scrollbar-base-thin p-3 bg-accent/20 rounded-lg shadow-inner"
        >
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">{logs}</pre>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          {/* Refresh logs button */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          {/* Scroll to bottom button */}
          <div className="flex flex-row items-center gap-3">
            <Button
              variant="thirdary"
              size="sm"
              className="flex items-center gap-2"
              onClick={scrollToBottom}
            >
              <span>{t('scrollToBottom')}</span>
            </Button>
            {/* Open log folder button */}
            <Button
              variant="thirdary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                ipcManager.invoke('utils:open-log-path-in-explorer')
              }}
            >
              <span>{t('openLogFolder')}</span>
            </Button>
            {/* Copy logs as a file to clipboard button */}
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleCopyToClipboard}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t('copy')}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
