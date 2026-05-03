import type { DailyPlayTime } from '@appTypes/models'
import { Button } from '@ui/button'
import { DateTimeInput } from '@ui/date-input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { StepperInput } from '@ui/input'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBusinessDateKey } from '~/stores/game/dayBoundaryUtils'
import { parseLocalDate } from '~/stores/game/recordUtils'
import { cn } from '~/utils'

interface DailyPlayTimeEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dailyPlayTime: DailyPlayTime) => void
  dailyPlayTime?: DailyPlayTime
  isNew?: boolean
}

export function DailyPlayTimeEditDialog({
  isOpen,
  onClose,
  onSave,
  dailyPlayTime,
  isNew = false
}: DailyPlayTimeEditDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [date, setDate] = useState('')
  const [playTimeMinutes, setPlayTimeMinutes] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (dailyPlayTime && isOpen) {
      setDate(dailyPlayTime.date)
      setPlayTimeMinutes(dailyPlayTime.playTime / 60 / 1000)
    } else if (isNew && isOpen) {
      setDate(getBusinessDateKey(new Date()))
      setPlayTimeMinutes(60)
    }
    setError(null)
  }, [dailyPlayTime, isOpen, isNew])

  const handleSave = (): void => {
    if (isNaN(parseLocalDate(date).getTime())) {
      setError(t('detail.dailyPlayTimeEditor.dateRequired'))
      return
    }

    if (!Number.isFinite(playTimeMinutes) || playTimeMinutes <= 0) {
      setError(t('detail.dailyPlayTimeEditor.playTimeRequired'))
      return
    }

    onSave({
      date,
      playTime: playTimeMinutes * 60 * 1000
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew
              ? t('detail.dailyPlayTimeEditor.addDailyPlayTime')
              : t('detail.dailyPlayTimeEditor.editDailyPlayTime')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}

          <div className="grid gap-2">
            <label htmlFor="daily-play-time-date" className="text-sm font-medium">
              {t('detail.timersEditor.date')}
            </label>
            <DateTimeInput
              id="daily-play-time-date"
              mode="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              error={!!error && isNaN(parseLocalDate(date).getTime())}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="daily-play-time-minutes" className="text-sm font-medium">
              {t('detail.timersEditor.playTime')}
            </label>
            <div className={cn('relative flex items-center')}>
              <StepperInput
                id="daily-play-time-minutes"
                value={playTimeMinutes}
                min={0}
                steps={{ default: 5, shift: 600, alt: 60, ctrl: 1 }}
                onChange={(e) => setPlayTimeMinutes(Number(e.target.value))}
                inputClassName="pl-4 pr-8 w-full"
              />
              <span className="absolute right-2">min</span>
            </div>
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
