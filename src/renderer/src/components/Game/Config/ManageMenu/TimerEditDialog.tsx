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

  const formatForInput = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return format(date, "yyyy-MM-dd'T'HH:mm")
    } catch (_e) {
      return ''
    }
  }

  useEffect(() => {
    if (timer && isOpen) {
      // Load existing timer data if editing
      setStartDateTime(formatForInput(timer.start))
      setEndDateTime(formatForInput(timer.end))
    } else if (isNew && isOpen) {
      // Initialize with current time if adding new timer
      const now = new Date()
      setStartDateTime(format(now, "yyyy-MM-dd'T'HH:mm"))
      setEndDateTime('')
    }
    setError(null)
  }, [timer, isOpen, isNew])

  const handleSave = (): void => {
    if (!startDateTime || !endDateTime) {
      setError(t('detail.timerEditor.startDateRequired'))
      return
    }

    let formattedEndDateTime = ''
    if (endDateTime) {
      // Validate that start time is not after end time
      if (new Date(startDateTime) > new Date(endDateTime)) {
        setError(t('detail.timerEditor.startAfterEnd'))
        return
      }
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
            {isNew ? t('detail.timerEditor.addTimer') : t('detail.timerEditor.editTimer')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}

          <div className="grid gap-2">
            <label htmlFor="start-datetime" className="text-sm font-medium">
              {t('detail.timerEditor.startDateTime')}
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
              {t('detail.timerEditor.endDateTime')}
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
            {t('utils:common.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('utils:common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
