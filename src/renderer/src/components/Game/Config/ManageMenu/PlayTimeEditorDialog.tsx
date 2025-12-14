import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@ui/alert-dialog'
import { Button } from '@ui/button'
import { Card } from '@ui/card'
import { Dialog, DialogContent } from '@ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { StepperInput } from '@ui/input'
import { format } from 'date-fns'
import { Menu, PlusCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { TimerEditDialog } from './TimerEditDialog'

interface Timer {
  start: string
  end: string
}

function validateTimer(value: unknown): { valid: boolean; message?: string } {
  if (typeof value !== 'object' || value === null) return { valid: false, message: 'Not an object' }

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)

  if (keys.length !== 2) return { valid: false, message: 'Number of keys is not 2' }
  if (!keys.includes('start') || !keys.includes('end'))
    return { valid: false, message: 'Missing start or end key' }
  if (typeof obj.start !== 'string' || typeof obj.end !== 'string')
    return { valid: false, message: 'Values must be strings' }
  if (isNaN(Date.parse(obj.start)) || isNaN(Date.parse(obj.end)))
    return { valid: false, message: 'Invalid date' }

  return { valid: true }
}

function parseTimers(data: string): Timer[] {
  const parsed = JSON.parse(data)

  if (!Array.isArray(parsed)) {
    throw new Error('Not an array')
  }

  for (const [index, item] of parsed.entries()) {
    const validation = validateTimer(item)
    if (!validation.valid) {
      throw new Error(`Invalid timer item at index ${index}: ${validation.message}`)
    }
  }

  return parsed
}

export function PlayTimeEditorDialog({
  gameId,
  setIsOpen
}: {
  gameId: string
  setIsOpen: (value: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [record, setRecord] = useGameState(gameId, 'record')
  const [hasImported, setHasImported] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const calculateTotalPlayTime = (timersList: Timer[]): number => {
    return timersList.reduce((total, timer) => {
      if (!timer.start || !timer.end) return total
      const start = new Date(timer.start).getTime()
      const end = new Date(timer.end).getTime()
      return total + Math.max(0, end - start)
    }, 0) // milliseconds
  }

  const validateAndSort = (
    timers: Timer[]
  ): {
    message: string | null
    sortedTimers: Timer[]
  } => {
    const timersWithIndex = timers.map((timer, originalIndex) => ({
      timer,
      originalIndex,
      timerStamped: { start: new Date(timer.start).getTime(), end: new Date(timer.end).getTime() }
    }))

    for (const { originalIndex, timerStamped } of timersWithIndex) {
      if (isNaN(timerStamped.start) || isNaN(timerStamped.end)) {
        return {
          message: t('detail.timersEditor.error.invalidTime', { index: originalIndex + 1 }),
          sortedTimers: timers
        }
      }

      if (timerStamped.end < timerStamped.start) {
        return {
          message: t('detail.timersEditor.error.endBeforeStart', { index: originalIndex + 1 }),
          sortedTimers: timers
        }
      }
    }

    const sortedWithIndex = [...timersWithIndex].sort(
      (a, b) => a.timerStamped.start - b.timerStamped.start
    )

    for (let i = 1; i < sortedWithIndex.length; i++) {
      const prevEnd = sortedWithIndex[i - 1].timerStamped.end
      const currStart = sortedWithIndex[i].timerStamped.start

      if (prevEnd > currStart) {
        return {
          message: t('detail.timersEditor.error.overlapMessage', {
            first: sortedWithIndex[i - 1].originalIndex + 1,
            second: sortedWithIndex[i].originalIndex + 1
          }),
          sortedTimers: sortedWithIndex.map((item) => item.timer)
        }
      }
    }

    return {
      message: null,
      sortedTimers: sortedWithIndex.map((item) => item.timer)
    }
  }

  const [timers, setTimers] = useState<Timer[]>(record.timers || [])
  const [fuzzyTime, setFuzzyTime] = useState(() => {
    const oldTimersTime = calculateTotalPlayTime(record.timers)
    return Math.max(0, record.playTime - oldTimersTime) / 1000 / 60
  })

  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false)
  const [editingTimer, setEditingTimer] = useState<Timer | undefined>(undefined)
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

  const saveTimer = (timer: Timer): void => {
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
    const { message, sortedTimers } = validateAndSort(timers)
    if (message) {
      toast.error(message)
      return
    }

    // preserve fuzzy play time for compatibility with old data
    // (e.g. imported from Steam, previous manual edits)
    const playTimeMs = calculateTotalPlayTime(sortedTimers)
    setRecord({
      ...record,
      timers: sortedTimers,
      playTime: playTimeMs + fuzzyTime * 60 * 1000
    })
    setIsOpen(false)
  }

  const handleExportClipboard = (): void => {
    copyWithToast(JSON.stringify(record.timers))
  }

  const handleImportClipboard = (): void => {
    navigator.clipboard
      .readText()
      .then((data) => {
        setTimers(parseTimers(data))
        setHasImported(true)
      })
      .catch((error) => {
        toast.error(t('detail.timersEditor.error.invalidJson', { error: error.message }))
      })
  }

  return (
    <>
      <Dialog open={true} onOpenChange={setIsOpen}>
        <DialogContent showCloseButton={true} className={cn('w-[600px] flex flex-col gap-3')}>
          <h3 className="text-xl font-bold mb-2">{t('detail.timersEditor.title')}</h3>

          <div className="flex flex-row gap-2">
            {/* Add Timer */}
            <Button
              variant="outline"
              onClick={openAddTimer}
              className="flex items-center gap-2 flex-1"
            >
              <PlusCircleIcon className="h-4 w-4" />
              {t('detail.timersEditor.addTimer')}
            </Button>

            {/* Timer Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-5">
                <DropdownMenuItem onSelect={handleExportClipboard}>
                  {t('detail.timersEditor.action.exportToClipboard')}
                </DropdownMenuItem>
                {/* <DropdownMenuItem>To File</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleImportClipboard}>
                  {t('detail.timersEditor.action.importFromClipboard')}
                </DropdownMenuItem>
                {/* <DropdownMenuItem>From File</DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Timer List */}
          <div className="mb-2">
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
                    className="relative flex flex-row items-center justify-between bg-accent/40 p-3 rounded-md"
                  >
                    {/* Index */}
                    <div className="absolute inset-0 flex items-center justify-center text-xl text-muted-foreground/50 pointer-events-none select-none">
                      {index + 1}
                    </div>

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
                      <Button variant="delete" size="sm" onClick={() => deleteTimer(index)}>
                        {t('utils:common.delete')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Fuzzy Time Input */}
          <div>
            <h4 className="text-md font-semibold mb-2">{t('detail.timersEditor.fuzzyTime')}</h4>
            <div className="flex gap-3 items-center">
              <div className={cn('relative flex w-1/3 items-center')}>
                <StepperInput
                  value={fuzzyTime}
                  min={0}
                  steps={{ default: 5, shift: 600, alt: 60, ctrl: 1 }}
                  onChange={(e) => setFuzzyTime(Number(e.target.value))}
                  inputClassName="pl-4 pr-8 w-full"
                />
                <span className="absolute right-2">min</span>
              </div>
              <div>{`(${t('{{date, gameTime}}', { date: Number(fuzzyTime) * 60 * 1000 })})`}</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4 mt-2">
            {/* Total Play Time */}
            <div className="text-md">
              <span className="font-medium">{t('detail.timersEditor.totalPlayTime')}:</span>{' '}
              {t('{{date, gameTime}}', {
                date: calculateTotalPlayTime(timers) + fuzzyTime * 60 * 1000
              })}
            </div>
            {/* Save and Cancel Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t('utils:common.cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (hasImported) {
                    setAlertOpen(true)
                  } else {
                    handleSave()
                  }
                }}
              >
                {t('utils:common.save')}
              </Button>
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

      {/* Alert Dialog for Restore Timers*/}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('detail.timersEditor.confirmImport')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('detail.timersEditor.importWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>{t('utils:common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
