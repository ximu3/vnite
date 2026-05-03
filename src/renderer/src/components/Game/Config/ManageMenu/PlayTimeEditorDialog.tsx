import type { DailyPlayTime, Timer } from '@appTypes/models'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { format } from 'date-fns'
import { Menu, PlusCircleIcon } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useGameState } from '~/hooks'
import { calculateTotalDailyPlayTime, normalizeDailyPlayTimes } from '~/stores/game/recordUtils'
import { cn, copyWithToast } from '~/utils'
import { DailyPlayTimeEditDialog } from './DailyPlayTimeEditDialog'
import { TimerEditDialog } from './TimerEditDialog'
import { parsePlayTimeClipboardData, validateAndSortTimers } from './utils'

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

  const [timers, setTimers] = useState<Timer[]>(record.timers || [])
  const [dailyPlayTimes, setDailyPlayTimes] = useState<DailyPlayTime[]>(
    normalizeDailyPlayTimes(record.dailyPlayTimes || [])
  )
  const [fuzzyTime, setFuzzyTime] = useState(() => {
    const oldTimersTime = calculateTotalPlayTime(record.timers || [])
    const oldDailyPlayTime = calculateTotalDailyPlayTime(record.dailyPlayTimes || [])
    return Math.max(0, record.playTime - oldTimersTime - oldDailyPlayTime) / 1000 / 60
  })

  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false)
  const [editingTimer, setEditingTimer] = useState<Timer | undefined>(undefined)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isDailyPlayTimeDialogOpen, setIsDailyPlayTimeDialogOpen] = useState(false)
  const [editingDailyPlayTime, setEditingDailyPlayTime] = useState<DailyPlayTime | undefined>(
    undefined
  )
  const [editingDailyPlayTimeIndex, setEditingDailyPlayTimeIndex] = useState<number | null>(null)

  const formatDateTime = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm')
    } catch (_e) {
      return dateStr
    }
  }

  const formatDuration = (start: string, end: string): string => {
    if (!start || !end) return '0'
    const minutes = (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60 // minutes

    if (minutes >= 1) return String(Math.floor(minutes))
    else if (minutes > 0) return '< 1'
    return '0'
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

  const openAddDailyPlayTime = (): void => {
    setEditingDailyPlayTime(undefined)
    setEditingDailyPlayTimeIndex(null)
    setIsDailyPlayTimeDialogOpen(true)
  }

  const openEditDailyPlayTime = (index: number): void => {
    setEditingDailyPlayTime(dailyPlayTimes[index])
    setEditingDailyPlayTimeIndex(index)
    setIsDailyPlayTimeDialogOpen(true)
  }

  const saveDailyPlayTime = (dailyPlayTime: DailyPlayTime): void => {
    if (editingDailyPlayTimeIndex !== null) {
      const newDailyPlayTimes = [...dailyPlayTimes]
      newDailyPlayTimes[editingDailyPlayTimeIndex] = dailyPlayTime
      setDailyPlayTimes(newDailyPlayTimes)
    } else {
      setDailyPlayTimes([...dailyPlayTimes, dailyPlayTime])
    }
    setIsDailyPlayTimeDialogOpen(false)
  }

  const deleteDailyPlayTime = (index: number): void => {
    setDailyPlayTimes(dailyPlayTimes.filter((_, i) => i !== index))
  }

  const handleSave = (): void => {
    const { message, sortedTimers } = validateAndSortTimers(timers)
    if (message) {
      toast.error(message)
      return
    }

    // preserve fuzzy play time for compatibility with old data
    // (e.g. imported from Steam, previous manual edits)
    const playTimeMs = calculateTotalPlayTime(sortedTimers)
    // Persist daily play time records in canonical form
    const normalizedDailyPlayTimes = normalizeDailyPlayTimes(dailyPlayTimes)
    const dailyPlayTimeMs = calculateTotalDailyPlayTime(normalizedDailyPlayTimes)
    setRecord({
      ...record,
      timers: sortedTimers,
      dailyPlayTimes: normalizedDailyPlayTimes,
      playTime: playTimeMs + dailyPlayTimeMs + fuzzyTime * 60 * 1000
    })
    setIsOpen(false)
  }

  const handleExportClipboard = (): void => {
    copyWithToast(
      JSON.stringify({
        timers,
        dailyPlayTimes: normalizeDailyPlayTimes(dailyPlayTimes)
      })
    )
  }

  const handleImportClipboard = (): void => {
    navigator.clipboard
      .readText()
      .then((data) => {
        const parsed = parsePlayTimeClipboardData(data)
        setTimers(parsed.timers)
        setDailyPlayTimes(parsed.dailyPlayTimes)
        setHasImported(true)
      })
      .catch((error) => {
        toast.error(t('detail.timersEditor.error.invalidJson', { error: error.message }))
      })
  }

  const ButtonMenu = (): React.JSX.Element => (
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
  )

  return (
    <>
      <Dialog open={true} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={true}
          className={cn('w-[650px] h-[90vh] overflow-hidden flex flex-col gap-3')}
        >
          <div className="flex items-center gap-3 pr-8">
            <h3 className="text-xl font-bold">{t('detail.timersEditor.title')}</h3>
          </div>

          <Tabs defaultValue="timers" className="gap-3 flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="timers">{t('detail.timersEditor.timersList')}</TabsTrigger>
              <TabsTrigger value="daily">{t('detail.timersEditor.dailyPlayTimes')}</TabsTrigger>
            </TabsList>

            <TabsContent value="timers" className="mt-0 min-h-0 flex-col data-[state=active]:flex">
              {/* Timer List */}
              <div className="min-h-0 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h4 className="text-md font-semibold">{t('detail.timersEditor.timersList')}</h4>
                  <Button variant="outline" size="sm" onClick={openAddTimer}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    {t('detail.timersEditor.addTimer')}
                  </Button>
                  <ButtonMenu />
                </div>
                {timers.length === 0 ? (
                  <div className="text-muted-foreground p-4 text-center bg-muted rounded-md flex-1 flex items-center justify-center">
                    {t('detail.timersEditor.noTimers')}
                  </div>
                ) : (
                  <div className="space-y-2 min-h-0 flex-1 overflow-y-auto scrollbar-base pr-1 pb-1">
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
                            <span className="font-medium">
                              {t('detail.timersEditor.startTime')}:
                            </span>{' '}
                            {formatDateTime(timer.start)}
                          </div>
                          {/* End Time */}
                          <div>
                            <span className="font-medium">{t('detail.timersEditor.endTime')}:</span>{' '}
                            {timer.end
                              ? formatDateTime(timer.end)
                              : t('detail.timersEditor.ongoing')}
                          </div>
                          {/* Duration */}
                          {timer.start && timer.end && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {t('detail.timersEditor.duration')}:{' '}
                              {formatDuration(timer.start, timer.end)}{' '}
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
            </TabsContent>

            <TabsContent value="daily" className="mt-0 min-h-0 flex-col data-[state=active]:flex">
              {/* Daily Play Time List */}
              <div className="min-h-0 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h4 className="text-md font-semibold">
                    {t('detail.timersEditor.dailyPlayTimes')}
                  </h4>
                  <Button variant="outline" size="sm" onClick={openAddDailyPlayTime}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    {t('detail.timersEditor.addDailyPlayTime')}
                  </Button>
                  <ButtonMenu />
                </div>
                {dailyPlayTimes.length === 0 ? (
                  <div className="text-muted-foreground p-4 text-center bg-muted rounded-md flex-1 flex items-center justify-center">
                    {t('detail.timersEditor.noDailyPlayTimes')}
                  </div>
                ) : (
                  <div className="space-y-2 min-h-0 flex-1 overflow-y-auto scrollbar-base pr-1 pb-1">
                    {dailyPlayTimes.map((item, index) => (
                      <Card
                        key={index}
                        className="relative flex flex-row items-center justify-between gap-3 bg-accent/40 p-3 rounded-md"
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xl text-muted-foreground/50 pointer-events-none select-none">
                          {index + 1}
                        </div>
                        <div className="flex-1 z-10">
                          <div>
                            <span className="font-medium">{t('detail.timersEditor.date')}:</span>{' '}
                            {item.date}
                          </div>
                          <div>
                            <span className="font-medium">
                              {t('detail.timersEditor.playTime')}:
                            </span>{' '}
                            {t('{{date, gameTime}}', { date: item.playTime })}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 z-10">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openEditDailyPlayTime(index)}
                          >
                            {t('utils:common.edit')}
                          </Button>
                          <Button
                            variant="delete"
                            size="sm"
                            onClick={() => deleteDailyPlayTime(index)}
                          >
                            {t('utils:common.delete')}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Fuzzy Time Input */}
          <div className="shrink-0">
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

          <div className="flex items-center justify-between border-t pt-4 mt-2 shrink-0">
            {/* Total Play Time */}
            <div className="text-md">
              <span className="font-medium">{t('detail.timersEditor.totalPlayTime')}:</span>{' '}
              {t('{{date, gameTime}}', {
                date:
                  calculateTotalPlayTime(timers) +
                  calculateTotalDailyPlayTime(dailyPlayTimes) +
                  fuzzyTime * 60 * 1000
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

      {/* Daily Play Time Edit Dialog */}
      <DailyPlayTimeEditDialog
        isOpen={isDailyPlayTimeDialogOpen}
        onClose={() => setIsDailyPlayTimeDialogOpen(false)}
        onSave={saveDailyPlayTime}
        dailyPlayTime={editingDailyPlayTime}
        isNew={editingDailyPlayTimeIndex === null}
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
