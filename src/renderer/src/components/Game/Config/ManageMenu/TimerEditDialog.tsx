import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { DateTimeInput } from '~/components/ui/date-input'

interface TimerEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (timer: { start: string; end: string }) => void
  timer?: { start: string; end: string }
  isNew?: boolean
}

export function TimerEditDialog({
  isOpen,
  onClose,
  onSave,
  timer,
  isNew = false
}: TimerEditDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 格式化日期时间为HTML datetime-local格式 (YYYY-MM-DDThh:mm)
  const formatForInput = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return format(date, "yyyy-MM-dd'T'HH:mm")
    } catch (_e) {
      return ''
    }
  }

  // 加载timer数据
  useEffect(() => {
    if (timer && isOpen) {
      setStartDateTime(formatForInput(timer.start))
      setEndDateTime(formatForInput(timer.end))
    } else if (isNew && isOpen) {
      // 如果是新建，默认设置为当前日期时间
      const now = new Date()
      setStartDateTime(format(now, "yyyy-MM-dd'T'HH:mm"))
      setEndDateTime('')
    }
    setError(null)
  }, [timer, isOpen, isNew])

  // 验证并保存
  const handleSave = (): void => {
    // 验证开始时间
    if (!startDateTime || !endDateTime) {
      setError(t('detail.timerEditor.startDateRequired', '必须设置开始时间和结束时间'))
      return
    }

    let formattedEndDateTime = ''
    if (endDateTime) {
      // 验证开始时间不能晚于结束时间
      if (new Date(startDateTime) > new Date(endDateTime)) {
        setError(t('detail.timerEditor.startAfterEnd', '开始时间不能晚于结束时间'))
        return
      }
      // 将时间格式转为ISO格式
      formattedEndDateTime = new Date(endDateTime).toISOString()
    }

    onSave({
      start: new Date(startDateTime).toISOString(),
      end: formattedEndDateTime
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew
              ? t('detail.timerEditor.addTimer', '添加游戏计时')
              : t('detail.timerEditor.editTimer', '编辑游戏计时')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}

          <div className="grid gap-2">
            <label htmlFor="start-datetime" className="text-sm font-medium">
              {t('detail.timerEditor.startDateTime', '开始时间')}
            </label>
            <DateTimeInput
              id="start-datetime"
              mode="datetime"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              error={!!error && !startDateTime}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="end-datetime" className="text-sm font-medium">
              {t('detail.timerEditor.endDateTime', '结束时间')}
            </label>
            <DateTimeInput
              id="end-datetime"
              mode="datetime"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              error={!!error && !!endDateTime && new Date(startDateTime) > new Date(endDateTime)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('utils:common.cancel', '取消')}
          </Button>
          <Button onClick={handleSave}>{t('utils:common.save', '保存')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
