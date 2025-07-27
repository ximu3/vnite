import { format } from 'date-fns'
import { PlusCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { TimerEditDialog } from './TimerEditDialog'

export function PlayTimeEditorDialog({
  gameId,
  setIsOpen
}: {
  gameId: string
  setIsOpen: (value: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [record, setRecord] = useGameState(gameId, 'record')

  const [timers, setTimers] = useState<{ start: string; end: string }[]>(record.timers || [])

  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false)
  const [editingTimer, setEditingTimer] = useState<{ start: string; end: string } | undefined>(
    undefined
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const formatDateTime = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm')
    } catch (_e) {
      return dateStr
    }
  }

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0
    return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60) // minutes
  }

  const calculateTotalPlayTime = (timersList: { start: string; end: string }[]): number => {
    return timersList.reduce((total, timer) => {
      if (!timer.start || !timer.end) return total
      const start = new Date(timer.start).getTime()
      const end = new Date(timer.end).getTime()
      return total + Math.max(0, end - start)
    }, 0) // milliseconds
  }

  const openAddTimer = (): void => {
    setEditingTimer(undefined)
    setEditingIndex(null)
    setIsTimerDialogOpen(true)
  }

  const openEditTimer = (index: number): void => {
    setEditingTimer(timers[index])
    setEditingIndex(index)
    setIsTimerDialogOpen(true)
  }

  const saveTimer = (timer: { start: string; end: string }): void => {
    if (editingIndex !== null) {
      // Update existing timer
      const newTimers = [...timers]
      newTimers[editingIndex] = timer
      setTimers(newTimers)
    } else {
      // Add new timer
      setTimers([...timers, timer])
    }
    setIsTimerDialogOpen(false)
  }

  const deleteTimer = (index: number): void => {
    const newTimers = timers.filter((_, i) => i !== index)
    setTimers(newTimers)
  }

  const handleSave = (): void => {
    const playTimeMs = calculateTotalPlayTime(timers)
    setRecord({
      ...record,
      timers: timers,
      playTime: playTimeMs
    })
    setIsOpen(false)
  }

  return (
    <>
      <Dialog open={true} onOpenChange={setIsOpen}>
        <DialogContent showCloseButton={true} className={cn('w-[600px] flex flex-col gap-3')}>
          <h3 className="text-xl font-bold mb-2">{t('detail.timersEditor.title')}</h3>

          {/* Add Timer */}
          <Button
            variant="outline"
            onClick={openAddTimer}
            className="flex items-center gap-2 w-full"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {t('detail.timersEditor.addTimer')}
          </Button>

          {/* Timer List */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">{t('detail.timersEditor.timersList')}</h4>
            {timers.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center bg-muted rounded-md">
                {t('detail.timersEditor.noTimers')}
              </div>
            ) : (
              <div className="space-y-2 max-h-[25vh] lg:max-h-[50vh] overflow-y-auto scrollbar-base pr-1 pb-1">
                {timers.map((timer, index) => (
                  <Card
                    key={index}
                    className="flex flex-row items-center justify-between bg-accent/40 p-3 rounded-md"
                  >
                    {/* Timer Details */}
                    <div className="flex-1">
                      {/* Start Time */}
                      <div>
                        <span className="font-medium">{t('detail.timersEditor.startTime')}:</span>{' '}
                        {formatDateTime(timer.start)}
                      </div>
                      {/* End Time */}
                      <div>
                        <span className="font-medium">{t('detail.timersEditor.endTime')}:</span>{' '}
                        {timer.end ? formatDateTime(timer.end) : t('detail.timersEditor.ongoing')}
                      </div>
                      {/* Duration */}
                      {timer.start && timer.end && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {t('detail.timersEditor.duration')}:{' '}
                          {calculateDuration(timer.start, timer.end)}{' '}
                          {t('detail.timersEditor.minutes')}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <Button variant="default" size="sm" onClick={() => openEditTimer(index)}>
                        {t('utils:common.edit')}
                      </Button>
                      <Button
                        variant="thirdary"
                        className="hover:bg-destructive"
                        size="sm"
                        onClick={() => deleteTimer(index)}
                      >
                        {t('utils:common.delete')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4 mt-2">
            {/* Total Play Time */}
            <div className="text-md">
              <span className="font-medium">{t('detail.timersEditor.totalPlayTime')}:</span>{' '}
              {t('{{date, gameTime}}', { date: calculateTotalPlayTime(timers) })}
            </div>
            {/* Save and Cancel Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t('utils:common.cancel')}
              </Button>
              <Button onClick={handleSave}>{t('utils:common.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timer Edit Dialog */}
      <TimerEditDialog
        isOpen={isTimerDialogOpen}
        onClose={() => setIsTimerDialogOpen(false)}
        onSave={saveTimer}
        timer={editingTimer}
        isNew={editingIndex === null}
      />
    </>
  )
}
