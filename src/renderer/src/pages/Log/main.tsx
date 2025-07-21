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

// 接收isOpen和setIsOpen作为props
export function LogDialog(): React.JSX.Element {
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
      console.error('获取日志失败:', error)
      setLogs('获取日志失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = (): void => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }

  // 当对话框打开时获取日志
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
      console.error('复制到剪贴板失败:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[70vw] h-[80vh]">
        <DialogHeader>
          <DialogTitle>应用日志</DialogTitle>
          <DialogDescription>当前应用生命周期内的日志信息</DialogDescription>
        </DialogHeader>

        <div
          ref={logContainerRef}
          className="h-full overflow-auto scrollbar-base-thin p-2 bg-card/40 rounded-lg shadow-md"
        >
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">{logs}</pre>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <div className="flex flex-row items-center gap-3">
            <Button
              variant="thirdary"
              size="sm"
              className="flex items-center gap-2"
              onClick={scrollToBottom}
            >
              <span>滚动到底部</span>
            </Button>
            <Button
              variant="thirdary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                ipcManager.invoke('utils:open-log-path-in-explorer')
              }}
            >
              <span>打开日志文件夹</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleCopyToClipboard}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制为app.log
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LogDialog
